package com.gigshield.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PremiumPredictionRequestDTO {
    private Double base_premium;
    private String city;
    private Double rainfall_mm;
    private Double temperature_c;
    private Integer aqi;
    private String risk_level;
    private String coverage_type;
}
