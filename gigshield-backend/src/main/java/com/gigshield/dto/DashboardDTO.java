package com.gigshield.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardDTO {
    // Worker info
    private String workerName;
    private String city;
    private Boolean isActive;

    // Policy summary
    private int activePolicies;
    private List<PolicyResponseDTO> policies;

    // Claims summary
    private int totalClaims;
    private int pendingClaims;
    private int approvedClaims;
    private BigDecimal totalPayouts;
    private List<ClaimResponseDTO> recentClaims;

    // Delivery stats summary
    private BigDecimal avgDeliveryDropRate;
    private BigDecimal totalEstimatedLoss;

    // Notifications
    private long unreadNotifications;
}
