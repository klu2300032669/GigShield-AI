package com.gigshield.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayoutResponseDTO {
    private Long id;
    private Long claimId;
    private BigDecimal amount;
    private String paymentMethod;
    private String transactionRef;
    private String status;
    private LocalDateTime paidAt;
}
