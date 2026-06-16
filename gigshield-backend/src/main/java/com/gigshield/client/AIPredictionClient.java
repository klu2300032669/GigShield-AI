package com.gigshield.client;

import com.gigshield.dto.RiskPredictionRequestDTO;
import com.gigshield.dto.RiskPredictionResponseDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;



/**
 * Client for the AI Prediction Service with fallback rule-based engine.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AIPredictionClient {

    private final RestTemplate restTemplate;

    @Value("${gigshield.ai.service.url:http://localhost:8000}")
    private String aiServiceUrl;

    public RiskPredictionResponseDTO predictRisk(RiskPredictionRequestDTO request) {
        String url = aiServiceUrl + "/predict";
        try {
            log.info("Calling AI service at {} for worker {}", url, request.getWorker_id());
            RiskPredictionResponseDTO response = restTemplate.postForObject(url, request, RiskPredictionResponseDTO.class);
            if (response != null) {
                return response;
            }
            log.warn("AI Service returned null response. Using fallback rules.");
            return calculateFallbackRisk(request);
        } catch (Exception e) {
            log.error("AI Service unavailable: {}. Using fallback rule-based engine.", e.getMessage());
            return calculateFallbackRisk(request);
        }
    }

    /**
     * Rule-based fallback when AI service is down.
     * Uses weighted scoring of environmental and activity factors.
     */
    private RiskPredictionResponseDTO calculateFallbackRisk(RiskPredictionRequestDTO request) {
        log.info("Computing fallback risk for worker {}", request.getWorker_id());

        var env = request.getEnvironmental_data();
        var act = request.getActivity_data();

        double riskScore = 0.0;
        java.util.List<String> factors = new java.util.ArrayList<>();

        // Rainfall factor (weight: 0.30)
        if (env.getRainfall_mm() > 40) {
            riskScore += 0.30;
            factors.add("Heavy rainfall (" + env.getRainfall_mm() + "mm)");
        } else if (env.getRainfall_mm() > 20) {
            riskScore += 0.15;
            factors.add("Moderate rainfall (" + env.getRainfall_mm() + "mm)");
        }

        // Temperature factor (weight: 0.20)
        if (env.getTemperature_c() > 42) {
            riskScore += 0.20;
            factors.add("Extreme heat (" + env.getTemperature_c() + "°C)");
        } else if (env.getTemperature_c() > 38) {
            riskScore += 0.10;
            factors.add("High temperature (" + env.getTemperature_c() + "°C)");
        }

        // AQI factor (weight: 0.20)
        if (env.getAqi() > 300) {
            riskScore += 0.20;
            factors.add("Hazardous air quality (AQI " + env.getAqi() + ")");
        } else if (env.getAqi() > 200) {
            riskScore += 0.10;
            factors.add("Very unhealthy air quality (AQI " + env.getAqi() + ")");
        }

        // Delivery drop rate factor (weight: 0.30)
        if (act.getDelivery_drop_rate() > 50) {
            riskScore += 0.30;
            factors.add("Severe delivery drop rate (" + Math.round(act.getDelivery_drop_rate()) + "%)");
        } else if (act.getDelivery_drop_rate() > 30) {
            riskScore += 0.15;
            factors.add("Moderate delivery drop rate (" + Math.round(act.getDelivery_drop_rate()) + "%)");
        }

        if (factors.isEmpty()) {
            factors.add("Normal operating conditions (fallback engine)");
        }
        factors.add("[Fallback: AI service unavailable]");

        riskScore = Math.min(1.0, riskScore);
        boolean triggerClaim = riskScore >= 0.70;

        String confidence;
        if (riskScore >= 0.90) confidence = "CRITICAL";
        else if (riskScore >= 0.70) confidence = "HIGH";
        else if (riskScore >= 0.40) confidence = "MEDIUM";
        else confidence = "LOW";

        return RiskPredictionResponseDTO.builder()
                .success(true)
                .risk_score(riskScore)
                .trigger_claim(triggerClaim)
                .confidence_level(confidence)
                .factors(factors)
                .model_version("FALLBACK-1.0")
                .build();
    }
}
