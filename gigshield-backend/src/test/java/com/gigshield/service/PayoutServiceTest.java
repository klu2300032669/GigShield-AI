package com.gigshield.service;

import com.gigshield.dto.PayoutResponseDTO;
import com.gigshield.exception.InvalidOperationException;
import com.gigshield.exception.ResourceNotFoundException;
import com.gigshield.model.*;
import com.gigshield.repository.PayoutRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class PayoutServiceTest {

    @Mock private PayoutRepository payoutRepository;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private PayoutService payoutService;

    private Payout initiatedPayout;
    private Worker worker;
    private Claim claim;

    @BeforeEach
    void setUp() {
        worker = Worker.builder().id(1L).fullName("John").email("john@test.com").build();
        Policy policy = Policy.builder().id(1L).worker(worker).build();
        claim = Claim.builder().id(1L).policy(policy).status(Claim.ClaimStatus.APPROVED).build();

        initiatedPayout = Payout.builder()
                .id(1L)
                .claim(claim)
                .amount(new BigDecimal("5000.00"))
                .paymentMethod(Payout.PaymentMethod.UPI)
                .status(Payout.PayoutStatus.INITIATED)
                .build();
    }

    @Test
    @DisplayName("completePayout() should complete an INITIATED payout")
    void completePayoutSuccess() {
        when(payoutRepository.findById(1L)).thenReturn(Optional.of(initiatedPayout));
        when(payoutRepository.save(any(Payout.class))).thenReturn(initiatedPayout);

        PayoutResponseDTO result = payoutService.completePayout(1L, "TXN-12345");

        assertThat(result).isNotNull();
        assertThat(initiatedPayout.getStatus()).isEqualTo(Payout.PayoutStatus.COMPLETED);
        assertThat(initiatedPayout.getTransactionRef()).isEqualTo("TXN-12345");
        assertThat(claim.getStatus()).isEqualTo(Claim.ClaimStatus.PAID);
        verify(notificationService).sendNotification(eq(1L), anyString(), anyString(), any());
    }

    @Test
    @DisplayName("completePayout() should throw for non-INITIATED payout")
    void completePayoutAlreadyCompleted() {
        initiatedPayout.setStatus(Payout.PayoutStatus.COMPLETED);
        when(payoutRepository.findById(1L)).thenReturn(Optional.of(initiatedPayout));

        assertThatThrownBy(() -> payoutService.completePayout(1L, "TXN-12345"))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("not in INITIATED status");
    }

    @Test
    @DisplayName("completePayout() should throw ResourceNotFoundException for unknown ID")
    void completePayoutNotFound() {
        when(payoutRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> payoutService.completePayout(999L, "TXN-12345"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("getPayoutById() should return DTO for existing payout")
    void getPayoutByIdSuccess() {
        initiatedPayout.setStatus(Payout.PayoutStatus.INITIATED);
        when(payoutRepository.findById(1L)).thenReturn(Optional.of(initiatedPayout));

        PayoutResponseDTO result = payoutService.getPayoutById(1L);

        assertThat(result).isNotNull();
        assertThat(result.getAmount()).isEqualByComparingTo(new BigDecimal("5000.00"));
    }
}
