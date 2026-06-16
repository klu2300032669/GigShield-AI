package com.gigshield.service;

import com.gigshield.exception.InvalidOperationException;
import com.gigshield.exception.RateLimitExceededException;
import com.gigshield.model.OtpVerification;
import com.gigshield.repository.OtpVerificationRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class OtpServiceTest {

    @Mock private OtpVerificationRepository otpRepository;
    @Mock private BCryptPasswordEncoder passwordEncoder;
    @Mock private EmailService emailService;

    @InjectMocks
    private OtpService otpService;

    @Test
    @DisplayName("generateOtp() should create and store BCrypt-hashed OTP")
    void generateOtpSuccess() {
        when(otpRepository.countByEmailAndCreatedAtAfter(eq("test@example.com"), any(LocalDateTime.class)))
                .thenReturn(0L);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$10$hashedOtp");
        when(otpRepository.save(any(OtpVerification.class))).thenAnswer(inv -> inv.getArgument(0));

        String otp = otpService.generateOtp("test@example.com");

        assertThat(otp).hasSize(6);
        assertThat(otp).matches("\\d{6}");
        verify(otpRepository).save(any(OtpVerification.class));
        verify(emailService).sendOtpEmail(eq("test@example.com"), eq(otp));
    }

    @Test
    @DisplayName("generateOtp() should throw RateLimitExceededException after 5 attempts")
    void generateOtpRateLimited() {
        when(otpRepository.countByEmailAndCreatedAtAfter(eq("test@example.com"), any(LocalDateTime.class)))
                .thenReturn(5L);

        assertThatThrownBy(() -> otpService.generateOtp("test@example.com"))
                .isInstanceOf(RateLimitExceededException.class)
                .hasMessageContaining("Too many OTP requests");
    }

    @Test
    @DisplayName("verifyOtp() should succeed with valid OTP")
    void verifyOtpSuccess() {
        OtpVerification otp = OtpVerification.builder()
                .email("test@example.com")
                .otpCode("$2a$10$hashedOtp")
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .attemptCount(0)
                .isVerified(false)
                .build();

        when(otpRepository.findTopByEmailAndIsVerifiedFalseOrderByCreatedAtDesc("test@example.com"))
                .thenReturn(Optional.of(otp));
        when(passwordEncoder.matches("123456", "$2a$10$hashedOtp")).thenReturn(true);
        when(otpRepository.save(any(OtpVerification.class))).thenAnswer(inv -> inv.getArgument(0));

        boolean result = otpService.verifyOtp("test@example.com", "123456");

        assertThat(result).isTrue();
        assertThat(otp.getIsVerified()).isTrue();
    }

    @Test
    @DisplayName("verifyOtp() should throw InvalidOperationException for expired OTP")
    void verifyOtpExpired() {
        OtpVerification otp = OtpVerification.builder()
                .email("test@example.com")
                .otpCode("$2a$10$hashedOtp")
                .expiresAt(LocalDateTime.now().minusMinutes(1)) // expired
                .attemptCount(0)
                .isVerified(false)
                .build();

        when(otpRepository.findTopByEmailAndIsVerifiedFalseOrderByCreatedAtDesc("test@example.com"))
                .thenReturn(Optional.of(otp));
        when(otpRepository.save(any(OtpVerification.class))).thenAnswer(inv -> inv.getArgument(0));

        assertThatThrownBy(() -> otpService.verifyOtp("test@example.com", "123456"))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("expired");
    }

    @Test
    @DisplayName("verifyOtp() should throw RateLimitExceededException after max attempts")
    void verifyOtpMaxAttempts() {
        OtpVerification otp = OtpVerification.builder()
                .email("test@example.com")
                .otpCode("$2a$10$hashedOtp")
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .attemptCount(5) // max reached
                .isVerified(false)
                .build();

        when(otpRepository.findTopByEmailAndIsVerifiedFalseOrderByCreatedAtDesc("test@example.com"))
                .thenReturn(Optional.of(otp));

        assertThatThrownBy(() -> otpService.verifyOtp("test@example.com", "123456"))
                .isInstanceOf(RateLimitExceededException.class)
                .hasMessageContaining("Maximum OTP verification attempts");
    }
}
