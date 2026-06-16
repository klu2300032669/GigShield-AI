package com.gigshield.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PolicyResponseDTO {
    private Long id;
    private Long workerId;
    private String workerName;
    private Long planId;
    private String planName;
    private String coverageType;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private BigDecimal premiumPaid;
    private BigDecimal maxPayout;
    private LocalDateTime createdAt;
}
