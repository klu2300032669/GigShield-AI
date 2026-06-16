package com.gigshield.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PolicyRequestDTO {

    @NotNull(message = "Worker ID is required")
    private Long workerId;

    @NotNull(message = "Plan ID is required")
    private Long planId;
}
