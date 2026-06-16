package com.gigshield.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskPredictionRequestDTO {
    private Long worker_id;
    private String city;
    private EnvironmentalData environmental_data;
    private ActivityData activity_data;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EnvironmentalData {
        private String event_type;
        private Double rainfall_mm;
        private Double temperature_c;
        private Integer aqi;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivityData {
        private Double online_hours;
        private Integer expected_deliveries;
        private Integer completed_deliveries;
        private Double delivery_drop_rate;
    }
}
