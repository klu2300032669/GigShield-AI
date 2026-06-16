package com.gigshield.service;

import com.gigshield.dto.PageResponse;
import com.gigshield.dto.PayoutResponseDTO;
import com.gigshield.exception.InvalidOperationException;
import com.gigshield.exception.ResourceNotFoundException;
import com.gigshield.model.Payout;
import com.gigshield.repository.PayoutRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Isolation;
import io.micrometer.core.annotation.Timed;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@SuppressWarnings("null")
public class PayoutService {

    private final PayoutRepository payoutRepository;
    private final NotificationService notificationService;

    public PageResponse<PayoutResponseDTO> getAllPayouts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Payout> payoutPage = payoutRepository.findAllPaginated(pageable);
        
        List<PayoutResponseDTO> content = payoutPage.getContent().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());

        return PageResponse.<PayoutResponseDTO>builder()
                .content(content)
                .page(payoutPage.getNumber())
                .size(payoutPage.getSize())
                .totalElements(payoutPage.getTotalElements())
                .totalPages(payoutPage.getTotalPages())
                .last(payoutPage.isLast())
                .first(payoutPage.isFirst())
                .build();
    }

    public PageResponse<PayoutResponseDTO> getWorkerPayouts(Long workerId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Payout> payoutPage = payoutRepository.findByWorkerIdPaginated(workerId, pageable);
        
        List<PayoutResponseDTO> content = payoutPage.getContent().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());

        return PageResponse.<PayoutResponseDTO>builder()
                .content(content)
                .page(payoutPage.getNumber())
                .size(payoutPage.getSize())
                .totalElements(payoutPage.getTotalElements())
                .totalPages(payoutPage.getTotalPages())
                .last(payoutPage.isLast())
                .first(payoutPage.isFirst())
                .build();
    }

    public PayoutResponseDTO getPayoutById(Long payoutId) {
        Payout payout = payoutRepository.findById(payoutId)
                .orElseThrow(() -> new ResourceNotFoundException("Payout", "id", payoutId));
        return toDTO(payout);
    }

    /**
     * Simulates completing a payout transaction.
     * In production, this would integrate with a payment gateway.
     */
    @Transactional(propagation = Propagation.REQUIRED, isolation = Isolation.READ_COMMITTED, rollbackFor = Exception.class)
    @Timed(value = "gigshield.payout.complete", description = "Time taken to complete a payout")
    public PayoutResponseDTO completePayout(Long payoutId, String transactionRef) {
        Payout payout = payoutRepository.findById(payoutId)
                .orElseThrow(() -> new ResourceNotFoundException("Payout", "id", payoutId));

        if (payout.getStatus() != Payout.PayoutStatus.INITIATED) {
            throw new InvalidOperationException("Payout is not in INITIATED status. Current status: " + payout.getStatus());
        }

        payout.setStatus(Payout.PayoutStatus.COMPLETED);
        payout.setTransactionRef(transactionRef);
        payout.setPaidAt(LocalDateTime.now());

        // Update claim status to PAID
        payout.getClaim().setStatus(com.gigshield.model.Claim.ClaimStatus.PAID);

        Payout saved = payoutRepository.save(payout);

        // Notify worker
        Long workerId = payout.getClaim().getPolicy().getWorker().getId();
        notificationService.sendNotification(
                workerId,
                "Payout Completed! ₹" + payout.getAmount() + " credited",
                "Transaction ref: " + transactionRef + " for Claim #" + payout.getClaim().getId(),
                com.gigshield.model.Notification.NotificationType.PAYOUT_UPDATE
        );

        return toDTO(saved);
    }

    private PayoutResponseDTO toDTO(Payout payout) {
        return PayoutResponseDTO.builder()
                .id(payout.getId())
                .claimId(payout.getClaim().getId())
                .amount(payout.getAmount())
                .paymentMethod(payout.getPaymentMethod() != null ? payout.getPaymentMethod().name() : null)
                .transactionRef(payout.getTransactionRef())
                .status(payout.getStatus().name())
                .paidAt(payout.getPaidAt())
                .build();
    }
}
