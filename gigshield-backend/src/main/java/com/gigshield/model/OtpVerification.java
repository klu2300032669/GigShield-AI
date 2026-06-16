package com.gigshield.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "otp_verifications", indexes = {
    @Index(name = "idx_otp_email_created", columnList = "email, created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OtpVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(name = "otp_code", nullable = false, length = 72)
    private String otpCode;

    @Column(name = "is_verified")
    private Boolean isVerified;

    @Column(name = "attempt_count")
    private Integer attemptCount;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (isVerified == null) isVerified = false;
        if (attemptCount == null) attemptCount = 0;
        if (expiresAt == null) expiresAt = LocalDateTime.now().plusMinutes(5);
    }
}
