package com.gigshield.service;

import com.gigshield.model.EnvironmentalEvent;
import com.gigshield.repository.EnvironmentalEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import com.gigshield.repository.PolicyRepository;
import com.gigshield.service.ClaimService;

/**
 * Automated weather monitoring service that fetches live weather data
 * from the Open-Meteo API (100% free, no API key needed) every hour.
 * When severe conditions are detected, it automatically creates
 * EnvironmentalEvent records which can trigger parametric claims.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WeatherFetchService {

    private final EnvironmentalEventRepository eventRepository;
    private final RestTemplate restTemplate;
    private final PolicyRepository policyRepository;
    private final ClaimService claimService;

    // Major Indian cities with their coordinates
    private static final List<CityCoord> MONITORED_CITIES = List.of(
            new CityCoord("Mumbai", 19.0760, 72.8777),
            new CityCoord("Delhi", 28.6139, 77.2090),
            new CityCoord("Bangalore", 12.9716, 77.5946),
            new CityCoord("Hyderabad", 17.3850, 78.4867),
            new CityCoord("Chennai", 13.0827, 80.2707),
            new CityCoord("Kolkata", 22.5726, 88.3639),
            new CityCoord("Pune", 18.5204, 73.8567),
            new CityCoord("Ahmedabad", 23.0225, 72.5714)
    );

    record CityCoord(String name, double lat, double lng) {}

    /**
     * Runs every hour. Fetches current weather for all monitored cities
     * and creates environmental events when severe conditions are detected.
     */
    @Scheduled(fixedRate = 3600000, initialDelay = 30000) // every 1 hour, first run 30s after startup
    public void fetchAndProcessWeather() {
        log.info("🌤️ Starting scheduled weather fetch for {} cities...", MONITORED_CITIES.size());
        int eventsCreated = 0;

        for (CityCoord city : MONITORED_CITIES) {
            try {
                eventsCreated += processCity(city);
            } catch (Exception e) {
                log.warn("Failed to fetch weather for {}: {}", city.name(), e.getMessage());
            }
        }

        log.info("🌤️ Weather fetch complete. {} new events created.", eventsCreated);
    }

    @SuppressWarnings("unchecked")
    private int processCity(CityCoord city) {
        String url = String.format(
                "https://api.open-meteo.com/v1/forecast?latitude=%s&longitude=%s" +
                "&current=temperature_2m,precipitation,rain,weather_code" +
                "&timezone=Asia/Kolkata",
                city.lat(), city.lng()
        );

        Map<String, Object> response = restTemplate.getForObject(url, Map.class);
        if (response == null || !response.containsKey("current")) return 0;

        Map<String, Object> current = (Map<String, Object>) response.get("current");
        double temp = toDouble(current.get("temperature_2m"));
        double rain = toDouble(current.get("rain"));
        double precip = toDouble(current.get("precipitation"));

        int eventsCreated = 0;

        // Check for Heavy Rain (>30mm precipitation)
        if (precip > 30 || rain > 30) {
            EnvironmentalEvent.Severity severity = precip > 80 ? EnvironmentalEvent.Severity.CRITICAL : EnvironmentalEvent.Severity.HIGH;
            EnvironmentalEvent savedEvent = createEvent(city.name(), EnvironmentalEvent.EventType.HEAVY_RAIN, severity,
                    BigDecimal.valueOf(precip), BigDecimal.valueOf(temp), null);
            eventsCreated++;
            log.info("🌧️ Heavy rain detected in {} ({}mm)", city.name(), precip);
            triggerParametricClaims(savedEvent, city.name(), com.gigshield.model.InsurancePlan.CoverageType.RAIN);
        }

        // Check for Extreme Heat (>42°C)
        if (temp > 42) {
            EnvironmentalEvent.Severity severity = temp > 46 ? EnvironmentalEvent.Severity.CRITICAL : EnvironmentalEvent.Severity.HIGH;
            EnvironmentalEvent savedEvent = createEvent(city.name(), EnvironmentalEvent.EventType.EXTREME_HEAT, severity,
                    BigDecimal.ZERO, BigDecimal.valueOf(temp), null);
            eventsCreated++;
            log.info("🔥 Extreme heat detected in {} ({}°C)", city.name(), temp);
            triggerParametricClaims(savedEvent, city.name(), com.gigshield.model.InsurancePlan.CoverageType.HEAT);
        }

        return eventsCreated;
    }

    public EnvironmentalEvent simulateSevereWeather(String city, String type) {
        EnvironmentalEvent savedEvent;
        log.info("⚠️ Admin triggered AI Disaster Simulation for {} ({})", city, type);
        if (type.equalsIgnoreCase("HEAVY_RAIN")) {
            savedEvent = createEvent(city, EnvironmentalEvent.EventType.HEAVY_RAIN, EnvironmentalEvent.Severity.CRITICAL,
                    BigDecimal.valueOf(150.0), BigDecimal.valueOf(25.0), 50);
            triggerParametricClaims(savedEvent, city, com.gigshield.model.InsurancePlan.CoverageType.RAIN);
        } else {
            savedEvent = createEvent(city, EnvironmentalEvent.EventType.EXTREME_HEAT, EnvironmentalEvent.Severity.CRITICAL,
                    BigDecimal.ZERO, BigDecimal.valueOf(48.5), 100);
            triggerParametricClaims(savedEvent, city, com.gigshield.model.InsurancePlan.CoverageType.HEAT);
        }
        return savedEvent;
    }

    private void triggerParametricClaims(EnvironmentalEvent event, String city, com.gigshield.model.InsurancePlan.CoverageType targetCoverage) {
        if (policyRepository == null || claimService == null) return;
        List<com.gigshield.model.Policy> activePolicies = policyRepository.findByStatus(com.gigshield.model.Policy.PolicyStatus.ACTIVE);
        int triggered = 0;
        for (com.gigshield.model.Policy policy : activePolicies) {
            // Check if worker is in the affected city
            if (policy.getWorker() != null && city.equalsIgnoreCase(policy.getWorker().getCity())) {
                com.gigshield.model.InsurancePlan.CoverageType planCoverage = policy.getPlan().getCoverageType();
                if (planCoverage == targetCoverage || planCoverage == com.gigshield.model.InsurancePlan.CoverageType.ALL) {
                    try {
                        // Estimated loss based on severity (CRITICAL = 100%, HIGH = 50% max payout)
                        BigDecimal lossFactor = event.getSeverity() == EnvironmentalEvent.Severity.CRITICAL ? BigDecimal.ONE : new BigDecimal("0.5");
                        BigDecimal estimatedLoss = policy.getPlan().getMaxPayout().multiply(lossFactor);
                        
                        // Execute AI smart contract via ClaimService
                        claimService.triggerClaim(policy.getId(), event.getId(), estimatedLoss, 4.0, 5);
                        triggered++;
                    } catch (Exception e) {
                        log.error("Failed to auto-trigger claim for policy {}: {}", policy.getId(), e.getMessage());
                    }
                }
            }
        }
        log.info("🤖 Auto-Adjudication Complete: {} claims triggered for {} event in {}", triggered, event.getEventType(), city);
    }

    private EnvironmentalEvent createEvent(String city, EnvironmentalEvent.EventType type,
                             EnvironmentalEvent.Severity severity,
                             BigDecimal rainfall, BigDecimal temperature, Integer aqi) {
        EnvironmentalEvent event = EnvironmentalEvent.builder()
                .city(city)
                .eventType(type)
                .severity(severity)
                .rainfallMm(rainfall)
                .temperatureC(temperature)
                .aqi(aqi)
                .eventTimestamp(LocalDateTime.now())
                .sourceApi("Open-Meteo")
                .build();

        return eventRepository.save(event);
    }

    private double toDouble(Object value) {
        if (value == null) return 0.0;
        if (value instanceof Number) return ((Number) value).doubleValue();
        try { return Double.parseDouble(value.toString()); } catch (Exception e) { return 0.0; }
    }
}
