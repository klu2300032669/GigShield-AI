package com.gigshield.service;

import com.gigshield.dto.*;
import com.gigshield.exception.*;
import com.gigshield.model.*;
import com.gigshield.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import io.micrometer.core.annotation.Timed;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@SuppressWarnings("null")
public class WorkerService {

    private final WorkerRepository workerRepository;
    private final PolicyRepository policyRepository;
    private final ClaimRepository claimRepository;
    private final PayoutRepository payoutRepository;
    private final DeliveryStatsRepository deliveryStatsRepository;
    private final NotificationRepository notificationRepository;
    private final EnvironmentalEventRepository environmentalEventRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    // Password strength: min 8 chars, at least 1 digit, at least 1 special character
    private static final Pattern PASSWORD_PATTERN = Pattern.compile(
            "^(?=.*[0-9])(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]).{8,}$"
    );

    @Transactional
    @Timed(value = "gigshield.worker.register", description = "Time taken to register a worker")
    public WorkerResponseDTO register(WorkerRegistrationDTO dto) {
        // Validate password strength
        validatePasswordStrength(dto.getPassword());

        if (workerRepository.existsByEmail(dto.getEmail())) {
            throw new DuplicateResourceException("Worker", "email", dto.getEmail());
        }

        Worker worker = Worker.builder()
                .fullName(dto.getFullName())
                .email(dto.getEmail())
                .passwordHash(passwordEncoder.encode(dto.getPassword()))
                .phone(dto.getPhone())
                .city(dto.getCity())
                .platformName(dto.getPlatformName())
                .role(Worker.Role.WORKER)  // Always force WORKER role on registration
                .emailVerified(false)
                .build();

        Worker saved = workerRepository.save(worker);
        return toResponseDTO(saved);
    }

    @Transactional
    public void markEmailVerified(String email) {
        Worker worker = workerRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Worker", "email", email));
        worker.setEmailVerified(true);
        workerRepository.save(worker);
    }
    
    @Transactional
    public void resetPassword(ForgotPasswordDTO dto) {
        // Verify the user exists
        Worker worker = workerRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Worker", "email", dto.getEmail()));

        // Validate the new password strength
        validatePasswordStrength(dto.getNewPassword());

        // Update the password
        worker.setPasswordHash(passwordEncoder.encode(dto.getNewPassword()));
        workerRepository.save(worker);
    }

    @Timed(value = "gigshield.worker.login", description = "Time taken to login")
    public WorkerResponseDTO login(WorkerLoginDTO dto) {
        Worker worker = workerRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new AuthenticationFailedException("Invalid email or password"));

        if (!passwordEncoder.matches(dto.getPassword(), worker.getPasswordHash())) {
            throw new AuthenticationFailedException("Invalid email or password");
        }

        return toResponseDTO(worker);
    }

    public WorkerResponseDTO getWorkerById(Long id) {
        Worker worker = workerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Worker", "id", id));
        return toResponseDTO(worker);
    }

    @Transactional
    public WorkerResponseDTO updateWorker(Long id, WorkerRegistrationDTO dto) {
        Worker worker = workerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Worker", "id", id));

        if (dto.getFullName() != null) worker.setFullName(dto.getFullName());
        if (dto.getPhone() != null) worker.setPhone(dto.getPhone());
        if (dto.getCity() != null) worker.setCity(dto.getCity());
        if (dto.getPlatformName() != null) worker.setPlatformName(dto.getPlatformName());

        Worker saved = workerRepository.save(worker);
        return toResponseDTO(saved);
    }

    @Transactional
    public void deleteWorker(Long id) {
        Worker worker = workerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Worker", "id", id));
                
        // Bypass Hibernate Optimistic Locking and cascade mapping by updating DB directly
        workerRepository.softDeleteWorker(id);
    }

    public DashboardDTO getDashboard(Long workerId) {
        Worker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new ResourceNotFoundException("Worker", "id", workerId));

        List<Policy> activePolicies = policyRepository.findByWorkerIdAndStatus(workerId, Policy.PolicyStatus.ACTIVE);
        List<Claim> allClaims = claimRepository.findByWorkerId(workerId);
        List<Payout> payouts = payoutRepository.findByWorkerId(workerId);
        List<DeliveryStats> stats = deliveryStatsRepository.findByWorkerId(workerId);

        long pendingClaims = allClaims.stream().filter(c -> c.getStatus() == Claim.ClaimStatus.PENDING).count();
        long approvedClaims = allClaims.stream().filter(c -> c.getStatus() == Claim.ClaimStatus.APPROVED || c.getStatus() == Claim.ClaimStatus.PAID).count();

        BigDecimal totalPayouts = payouts.stream()
                .filter(p -> p.getStatus() == Payout.PayoutStatus.COMPLETED)
                .map(Payout::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal avgDropRate = BigDecimal.ZERO;
        BigDecimal totalLoss = BigDecimal.ZERO;
        if (!stats.isEmpty()) {
            avgDropRate = stats.stream()
                    .map(DeliveryStats::getDeliveryDropRate)
                    .filter(r -> r != null)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(BigDecimal.valueOf(stats.size()), 2, RoundingMode.HALF_UP);
            totalLoss = stats.stream()
                    .map(DeliveryStats::getEstimatedIncomeLoss)
                    .filter(l -> l != null)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        List<PolicyResponseDTO> policyDTOs = activePolicies.stream().map(this::policyToDTO).collect(Collectors.toList());
        List<ClaimResponseDTO> recentClaimDTOs = allClaims.stream().limit(5).map(this::claimToDTO).collect(Collectors.toList());

        return DashboardDTO.builder()
                .workerName(worker.getFullName())
                .city(worker.getCity())
                .isActive(worker.getIsActive())
                .activePolicies(activePolicies.size())
                .policies(policyDTOs)
                .totalClaims(allClaims.size())
                .pendingClaims((int) pendingClaims)
                .approvedClaims((int) approvedClaims)
                .totalPayouts(totalPayouts)
                .recentClaims(recentClaimDTOs)
                .avgDeliveryDropRate(avgDropRate)
                .totalEstimatedLoss(totalLoss)
                .unreadNotifications(notificationRepository.countByWorkerIdAndIsReadFalse(workerId))
                .build();
    }

    // ---- Admin Methods ----

    public PageResponse<WorkerResponseDTO> getAllWorkers(int page, int size) {
        Page<Worker> workerPage = workerRepository.findAll(PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "registrationDate")));
        List<WorkerResponseDTO> dtos = workerPage.getContent().stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
        return PageResponse.<WorkerResponseDTO>builder()
                .content(dtos)
                .page(workerPage.getNumber())
                .size(workerPage.getSize())
                .totalElements(workerPage.getTotalElements())
                .totalPages(workerPage.getTotalPages())
                .last(workerPage.isLast())
                .first(workerPage.isFirst())
                .build();
    }

    @org.springframework.cache.annotation.Cacheable("platformStats")
    public AdminStatsDTO getPlatformStats() {
        List<Worker> allWorkers = workerRepository.findAll();
        List<Policy> allPolicies = policyRepository.findAll();
        List<Claim> allClaims = claimRepository.findAll();
        List<Payout> allPayouts = payoutRepository.findAll();

        BigDecimal totalRevenue = allPolicies.stream()
                .map(Policy::getPremiumPaid)
                .filter(p -> p != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPayoutAmount = allPayouts.stream()
                .filter(p -> p.getStatus() == Payout.PayoutStatus.COMPLETED)
                .map(Payout::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return AdminStatsDTO.builder()
                .totalWorkers(allWorkers.size())
                .activeWorkers(allWorkers.stream().filter(w -> Boolean.TRUE.equals(w.getIsActive())).count())
                .totalPolicies(allPolicies.size())
                .activePolicies(allPolicies.stream().filter(p -> p.getStatus() == Policy.PolicyStatus.ACTIVE).count())
                .totalClaims(allClaims.size())
                .pendingClaims(allClaims.stream().filter(c -> c.getStatus() == Claim.ClaimStatus.PENDING).count())
                .approvedClaims(allClaims.stream().filter(c -> c.getStatus() == Claim.ClaimStatus.APPROVED || c.getStatus() == Claim.ClaimStatus.PAID).count())
                .rejectedClaims(allClaims.stream().filter(c -> c.getStatus() == Claim.ClaimStatus.REJECTED).count())
                .totalPayouts(allPayouts.size())
                .completedPayouts(allPayouts.stream().filter(p -> p.getStatus() == Payout.PayoutStatus.COMPLETED).count())
                .totalRevenue(totalRevenue)
                .totalPayoutAmount(totalPayoutAmount)
                .totalEvents(environmentalEventRepository.count())
                .build();
    }

    @Transactional
    public WorkerResponseDTO toggleWorkerStatus(Long workerId) {
        Worker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new ResourceNotFoundException("Worker", "id", workerId));
        worker.setIsActive(!worker.getIsActive());
        Worker saved = workerRepository.save(worker);
        return toResponseDTO(saved);
    }

    @Transactional
    public WorkerResponseDTO promoteToAdmin(Long workerId) {
        Worker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new ResourceNotFoundException("Worker", "id", workerId));
        
        // Toggle role between WORKER and ADMIN
        if (worker.getRole() == Worker.Role.ADMIN) {
            // Prevent the last admin from demoting themselves
            long adminCount = workerRepository.countByRole(Worker.Role.ADMIN);
            if (adminCount <= 1) {
                throw new InvalidOperationException("Cannot demote the last admin. Promote another user first.");
            }
            worker.setRole(Worker.Role.WORKER);
        } else {
            worker.setRole(Worker.Role.ADMIN);
        }
        
        Worker saved = workerRepository.save(worker);
        return toResponseDTO(saved);
    }

    // ---- Helper Methods ----

    private void validatePasswordStrength(String password) {
        if (password == null || password.length() < 8) {
            throw new PasswordValidationException("Password must be at least 8 characters long");
        }
        if (!PASSWORD_PATTERN.matcher(password).matches()) {
            throw new PasswordValidationException(
                "Password must contain at least 1 number and 1 special character (!@#$%^&*...)"
            );
        }
    }

    private WorkerResponseDTO toResponseDTO(Worker worker) {
        return WorkerResponseDTO.builder()
                .id(worker.getId())
                .fullName(worker.getFullName())
                .email(worker.getEmail())
                .phone(worker.getPhone())
                .city(worker.getCity())
                .platformName(worker.getPlatformName())
                .role(worker.getRole() != null ? worker.getRole().name() : "WORKER")
                .emailVerified(worker.getEmailVerified())
                .registrationDate(worker.getRegistrationDate())
                .isActive(worker.getIsActive())
                .build();
    }

    private PolicyResponseDTO policyToDTO(Policy policy) {
        return PolicyResponseDTO.builder()
                .id(policy.getId())
                .workerId(policy.getWorker().getId())
                .workerName(policy.getWorker().getFullName())
                .planId(policy.getPlan().getId())
                .planName(policy.getPlan().getPlanName())
                .coverageType(policy.getPlan().getCoverageType().name())
                .startDate(policy.getStartDate())
                .endDate(policy.getEndDate())
                .status(policy.getStatus().name())
                .premiumPaid(policy.getPremiumPaid())
                .maxPayout(policy.getPlan().getMaxPayout())
                .createdAt(policy.getCreatedAt())
                .build();
    }

    private ClaimResponseDTO claimToDTO(Claim claim) {
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
