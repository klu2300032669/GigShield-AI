package com.gigshield.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequestDTO {
    private Long policyId;
    private Long workerId;
    private BigDecimal amount;
    private String currency; // e.g., "USD", "INR"
    private String paymentMethod; // e.g., "CARD", "UPI"
}
