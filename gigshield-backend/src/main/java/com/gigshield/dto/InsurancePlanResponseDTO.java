package com.gigshield.dto;

import com.gigshield.model.InsurancePlan.BillingCycle;
import com.gigshield.model.InsurancePlan.CoverageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InsurancePlanResponseDTO {
    private Long id;
    private String planName;
    private String description;
    private CoverageType coverageType;
    private BigDecimal premiumAmount;  // This will hold the dynamic premium
    private BigDecimal originalPremiumAmount; // The original baseline premium
    private BigDecimal maxPayout;
    private BillingCycle billingCycle;
    private Boolean isActive;
    private String pricingReasoning; // Reasoning from AI
}
