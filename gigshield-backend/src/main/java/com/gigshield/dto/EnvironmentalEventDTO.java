package com.gigshield.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnvironmentalEventDTO {

    @NotBlank(message = "City is required")
    private String city;

    @NotNull(message = "Event type is required")
    private String eventType;

    private BigDecimal rainfallMm;
    private BigDecimal temperatureC;
    private Integer aqi;

    @NotNull(message = "Severity is required")
    private String severity;

    private LocalDateTime eventTimestamp;
    private String sourceApi;
}
