package com.gigshield.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PremiumPredictionResponseDTO {
    private Double original_premium;
    private Double dynamic_premium;
    private Double risk_multiplier;
    private String reasoning;
}
