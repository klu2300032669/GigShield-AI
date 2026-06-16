package com.gigshield.service;

import com.gigshield.dto.*;
import com.gigshield.exception.*;
import com.gigshield.model.*;
import com.gigshield.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import io.micrometer.core.annotation.Timed;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@SuppressWarnings("null")
public class ClaimService {

    private final ClaimRepository claimRepository;
    private final PolicyRepository policyRepository;
    private final EnvironmentalEventRepository eventRepository;
    private final PayoutRepository payoutRepository;
    private final NotificationService notificationService;
    private final com.gigshield.client.AIPredictionClient aiPredictionClient;

    public PageResponse<ClaimResponseDTO> getWorkerClaims(Long workerId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Claim> claimPage = claimRepository.findByWorkerIdPaginated(workerId, pageable);
        
        List<ClaimResponseDTO> content = claimPage.getContent().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());

        return PageResponse.<ClaimResponseDTO>builder()
                .content(content)
                .page(claimPage.getNumber())
                .size(claimPage.getSize())
                .totalElements(claimPage.getTotalElements())
                .totalPages(claimPage.getTotalPages())
                .last(claimPage.isLast())
                .first(claimPage.isFirst())
                .build();
    }

    public ClaimResponseDTO getClaimById(Long claimId) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim", "id", claimId));
        return toDTO(claim);
    }

    // ---- Admin Methods ----

    public PageResponse<ClaimResponseDTO> getAllClaims(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Claim> claimPage = claimRepository.findAllPaginated(pageable);
        
        List<ClaimResponseDTO> content = claimPage.getContent().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());

        return PageResponse.<ClaimResponseDTO>builder()
                .content(content)
                .page(claimPage.getNumber())
                .size(claimPage.getSize())
                .totalElements(claimPage.getTotalElements())
                .totalPages(claimPage.getTotalPages())
                .last(claimPage.isLast())
                .first(claimPage.isFirst())
                .build();
    }

    @Transactional
    public ClaimResponseDTO approveClaim(Long claimId) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim", "id", claimId));

        if (claim.getStatus() != Claim.ClaimStatus.PENDING) {
            throw new InvalidOperationException("Only PENDING claims can be approved. Current status: " + claim.getStatus());
        }

        claim.setStatus(Claim.ClaimStatus.APPROVED);
        claim.setResolvedAt(LocalDateTime.now());
        claim.setFraudCheckPassed(true);
        Claim saved = claimRepository.save(claim);

        // Auto-create payout
        Payout payout = Payout.builder()
                .claim(saved)
                .amount(saved.getClaimAmount())
                .paymentMethod(Payout.PaymentMethod.UPI)
                .status(Payout.PayoutStatus.INITIATED)
                .build();
        payoutRepository.save(payout);

        // Notify worker
        notificationService.sendNotification(
                saved.getPolicy().getWorker().getId(),
                "Claim #" + saved.getId() + " Approved by Admin! Payout initiated for ₹" + saved.getClaimAmount(),
                "Your claim has been reviewed and approved by an administrator.",
                Notification.NotificationType.CLAIM_UPDATE
        );

        return toDTO(saved);
    }

    @Transactional
    public ClaimResponseDTO rejectClaim(Long claimId) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim", "id", claimId));

        if (claim.getStatus() != Claim.ClaimStatus.PENDING) {
            throw new InvalidOperationException("Only PENDING claims can be rejected. Current status: " + claim.getStatus());
        }

        claim.setStatus(Claim.ClaimStatus.REJECTED);
        claim.setResolvedAt(LocalDateTime.now());
        Claim saved = claimRepository.save(claim);

        // Notify worker
        notificationService.sendNotification(
                saved.getPolicy().getWorker().getId(),
                "Claim #" + saved.getId() + " Rejected by Admin",
                "Your claim was reviewed and rejected. Contact support for more details.",
                Notification.NotificationType.CLAIM_UPDATE
        );

        return toDTO(saved);
    }

    @Transactional
    public void deleteClaim(Long claimId) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim", "id", claimId));
        claimRepository.delete(claim);
    }

    /**
     * Triggers claim evaluation for a specific policy and event.
     * Uses the Python AI Service to calculate real-time probability of income loss.
     */
    @Transactional
    @Timed(value = "gigshield.claim.trigger", description = "Time taken to trigger a claim with AI prediction")
    public ClaimResponseDTO triggerClaim(Long policyId, Long eventId, BigDecimal estimatedLoss, Double onlineHours, Integer completedDeliveries) {
        Policy policy = policyRepository.findById(policyId)
                .orElseThrow(() -> new ResourceNotFoundException("Policy", "id", policyId));

        if (policy.getStatus() != Policy.PolicyStatus.ACTIVE) {
            throw new InvalidOperationException("Cannot create claim for inactive policy. Status: " + policy.getStatus());
        }

        EnvironmentalEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("EnvironmentalEvent", "id", eventId));

        // 1. Prepare data for AI model
        int expectedDeliveries = (int) Math.round(onlineHours * 2.5);
        double dropRate = expectedDeliveries > 0 ? 
            ((double) (expectedDeliveries - completedDeliveries) / expectedDeliveries) * 100 : 0.0;

        com.gigshield.dto.RiskPredictionRequestDTO request = com.gigshield.dto.RiskPredictionRequestDTO.builder()
                .worker_id(policy.getWorker().getId())
                .city(event.getCity())
                .environmental_data(com.gigshield.dto.RiskPredictionRequestDTO.EnvironmentalData.builder()
                        .event_type(event.getEventType().name())
                        .rainfall_mm(event.getRainfallMm() != null ? event.getRainfallMm().doubleValue() : 0.0)
                        .temperature_c(event.getTemperatureC() != null ? event.getTemperatureC().doubleValue() : 25.0)
                        .aqi(event.getAqi() != null ? event.getAqi() : 50)
                        .build())
                .activity_data(com.gigshield.dto.RiskPredictionRequestDTO.ActivityData.builder()
                        .online_hours(onlineHours)
                        .expected_deliveries(expectedDeliveries)
                        .completed_deliveries(completedDeliveries)
                        .delivery_drop_rate(dropRate)
                        .build())
                .build();

        // 2. Call the Python AI Service!
        com.gigshield.dto.RiskPredictionResponseDTO aiResponse = aiPredictionClient.predictRisk(request);
        BigDecimal riskScore = BigDecimal.valueOf(aiResponse.getRisk_score());

        // Calculate claim amount (capped at max payout)
        BigDecimal maxPayout = policy.getPlan().getMaxPayout();
        BigDecimal claimAmount = estimatedLoss.min(maxPayout);

        // Perform basic fraud check
        boolean fraudCheckPassed = performFraudCheck(policy, event, riskScore);

        // Determine initial status based on AI Service recommendation
        Claim.ClaimStatus status = Claim.ClaimStatus.PENDING;
        if (fraudCheckPassed && aiResponse.isTrigger_claim()) {
            status = Claim.ClaimStatus.APPROVED;
        } else if (!fraudCheckPassed) {
            status = Claim.ClaimStatus.REJECTED;
        }

        Claim claim = Claim.builder()
                .policy(policy)
                .event(event)
                .riskScore(riskScore)
                .estimatedLoss(estimatedLoss)
                .claimAmount(claimAmount)
                .status(status)
                .fraudCheckPassed(fraudCheckPassed)
                .build();

        if (status == Claim.ClaimStatus.APPROVED) {
            claim.setResolvedAt(LocalDateTime.now());
        }

        Claim saved = claimRepository.save(claim);

        // Auto-create payout if approved
        if (saved.getStatus() == Claim.ClaimStatus.APPROVED) {
            Payout payout = Payout.builder()
                    .claim(saved)
                    .amount(claimAmount)
                    .paymentMethod(Payout.PaymentMethod.UPI)
                    .status(Payout.PayoutStatus.INITIATED)
                    .build();
            payoutRepository.save(payout);
        }

        // Send notification to worker
        String title = status == Claim.ClaimStatus.APPROVED
                ? "Claim Approved! Payout initiated for ₹" + claimAmount
                : status == Claim.ClaimStatus.REJECTED
                ? "Claim Rejected - Fraud check failed"
                : "New Claim Created - Under review";

        notificationService.sendNotification(
                policy.getWorker().getId(),
                title,
                "Claim #" + saved.getId() + " for " + event.getEventType() + " event in " + event.getCity(),
                Notification.NotificationType.CLAIM_UPDATE
        );

        return toDTO(saved);
    }

    /**
     * Basic fraud detection checks.
     */
    private boolean performFraudCheck(Policy policy, EnvironmentalEvent event, BigDecimal riskScore) {
        if (!policy.getWorker().getCity().equalsIgnoreCase(event.getCity())) {
            return false;
        }

        InsurancePlan.CoverageType coverage = policy.getPlan().getCoverageType();
        if (coverage != InsurancePlan.CoverageType.ALL) {
            boolean matches = switch (event.getEventType()) {
                case HEAVY_RAIN -> coverage == InsurancePlan.CoverageType.RAIN;
                case EXTREME_HEAT -> coverage == InsurancePlan.CoverageType.HEAT;
                case HIGH_POLLUTION -> coverage == InsurancePlan.CoverageType.POLLUTION;
            };
            if (!matches) return false;
        }

        if (riskScore.compareTo(BigDecimal.ONE) > 0) {
            return false;
        }

        return true;
    }

    /**
     * Bulk approve claims by list of IDs.
     */
    @Transactional
    public List<ClaimResponseDTO> bulkApproveClaims(List<Long> claimIds) {
        List<ClaimResponseDTO> results = new ArrayList<>();
        for (Long id : claimIds) {
            try {
                results.add(approveClaim(id));
            } catch (Exception e) {
                // Skip claims that can't be approved (already processed, not found, etc.)
            }
        }
        return results;
    }

    /**
     * Bulk reject claims by list of IDs.
     */
    @Transactional
    public List<ClaimResponseDTO> bulkRejectClaims(List<Long> claimIds) {
        List<ClaimResponseDTO> results = new ArrayList<>();
        for (Long id : claimIds) {
            try {
                results.add(rejectClaim(id));
            } catch (Exception e) {
                // Skip claims that can't be rejected
            }
        }
        return results;
    }

    private ClaimResponseDTO toDTO(Claim claim) {
        ClaimResponseDTO.ClaimResponseDTOBuilder builder = ClaimResponseDTO.builder()
                .id(claim.getId())
                .policyId(claim.getPolicy().getId())
                .planName(claim.getPolicy().getPlan().getPlanName())
                .eventId(claim.getEvent().getId())
                .eventType(claim.getEvent().getEventType().name())
                .riskScore(claim.getRiskScore())
                .estimatedLoss(claim.getEstimatedLoss())
                .claimAmount(claim.getClaimAmount())
                .status(claim.getStatus().name())
                .fraudCheckPassed(claim.getFraudCheckPassed())
                .triggeredAt(claim.getTriggeredAt())
                .resolvedAt(claim.getResolvedAt());

        if (claim.getPayout() != null) {
            builder.payoutAmount(claim.getPayout().getAmount())
                    .payoutStatus(claim.getPayout().getStatus().name())
                    .paidAt(claim.getPayout().getPaidAt());
        }

        return builder.build();
    }
}
