package com.gigshield.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponseDTO {
    private String paymentIntentId;
    private String clientSecret; // For frontend to complete payment
    private String status; // e.g., "REQUIRES_PAYMENT_METHOD", "SUCCEEDED"
    private String errorMessage;
}
