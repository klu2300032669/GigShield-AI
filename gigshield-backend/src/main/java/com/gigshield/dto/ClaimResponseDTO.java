package com.gigshield.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClaimResponseDTO {
    private Long id;
    private Long policyId;
    private String planName;
    private Long eventId;
    private String eventType;
    private BigDecimal riskScore;
    private BigDecimal estimatedLoss;
    private BigDecimal claimAmount;
    private String status;
    private Boolean fraudCheckPassed;
    private LocalDateTime triggeredAt;
    private LocalDateTime resolvedAt;

    // Payout info (if exists)
    private BigDecimal payoutAmount;
    private String payoutStatus;
    private LocalDateTime paidAt;
}
