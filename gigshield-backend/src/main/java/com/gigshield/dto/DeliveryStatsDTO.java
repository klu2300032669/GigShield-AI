package com.gigshield.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryStatsDTO {

    @NotNull(message = "Worker ID is required")
    private Long workerId;

    @NotNull(message = "Date is required")
    private LocalDate date;

    @NotNull @Min(0)
    private Integer expectedDeliveries;

    @NotNull @Min(0)
    private Integer completedDeliveries;

    private BigDecimal estimatedIncomeLoss;
    private Long eventId;
}
