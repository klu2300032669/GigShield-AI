package com.gigshield.dto;

import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminStatsDTO {
    private long totalWorkers;
    private long activeWorkers;
    private long totalPolicies;
    private long activePolicies;
    private long totalClaims;
    private long pendingClaims;
    private long approvedClaims;
    private long rejectedClaims;
    private long totalPayouts;
    private long completedPayouts;
    private BigDecimal totalRevenue;
    private BigDecimal totalPayoutAmount;
    private long totalEvents;
}
