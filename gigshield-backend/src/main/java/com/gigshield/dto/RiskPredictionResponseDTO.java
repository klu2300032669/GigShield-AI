package com.gigshield.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskPredictionResponseDTO {
    private boolean success;
    private Double risk_score;
    private boolean trigger_claim;
    private String confidence_level;
    private List<String> factors;
    private String model_version;
}
