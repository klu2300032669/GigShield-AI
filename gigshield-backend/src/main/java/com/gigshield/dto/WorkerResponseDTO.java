package com.gigshield.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkerResponseDTO {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String city;
    private String platformName;
    private String role;
    private Boolean emailVerified;
    private LocalDateTime registrationDate;
    private Boolean isActive;
}
