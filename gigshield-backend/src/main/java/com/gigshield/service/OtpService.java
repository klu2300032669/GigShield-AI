package com.gigshield.service;

import com.gigshield.exception.InvalidOperationException;
import com.gigshield.exception.RateLimitExceededException;
import com.gigshield.exception.ResourceNotFoundException;
import com.gigshield.model.OtpVerification;
import com.gigshield.repository.OtpVerificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class OtpService {

    private final OtpVerificationRepository otpRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private static final SecureRandom random = new SecureRandom();

    private static final int MAX_OTP_ATTEMPTS = 5;
    private static final int RATE_LIMIT_WINDOW_MINUTES = 15;
    private static final int MAX_VERIFY_ATTEMPTS = 5;

    /**
     * Generates a 6-digit OTP, hashes it with BCrypt, stores the hash,
     * and sends the plain OTP to the user's email address.
     */
    @Transactional
    public String generateOtp(String email) {
        // Rate limiting: max 5 OTP requests per email per 15 minutes
        LocalDateTime windowStart = LocalDateTime.now().minusMinutes(RATE_LIMIT_WINDOW_MINUTES);
        long recentCount = otpRepository.countByEmailAndCreatedAtAfter(email, windowStart);
        if (recentCount >= MAX_OTP_ATTEMPTS) {
            throw new RateLimitExceededException(
                "Too many OTP requests. Please wait " + RATE_LIMIT_WINDOW_MINUTES + " minutes before trying again."
            );
        }

        // Generate a 6-digit OTP
        String otp = String.format("%06d", random.nextInt(999999));

        // Store BCrypt hash of the OTP (never plain text)
        OtpVerification verification = OtpVerification.builder()
                .email(email)
                .otpCode(passwordEncoder.encode(otp))
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .attemptCount(0)
                .build();

        otpRepository.save(verification);

        // Send the OTP via email
        emailService.sendOtpEmail(email, otp);
        
        log.info("=== OTP for {} was sent via email (valid for 5 minutes) ===", email);

        return otp;
    }

    /**
     * Verifies the OTP entered by the user against the BCrypt hash.
     */
    @Transactional
    public boolean verifyOtp(String email, String otpCode) {
        OtpVerification verification = otpRepository
                .findTopByEmailAndIsVerifiedFalseOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new ResourceNotFoundException("OTP", "email", email));

        // MASTER OTP BYPASS: Render free tier blocks SMTP port 587, so emails won't send.
        // We use 123456 as a master fallback for the demo.
        if ("123456".equals(otpCode)) {
            log.info("🔑 Master OTP used for {}", email);
            verification.setIsVerified(true);
            otpRepository.save(verification);
            return true;
        }

        // Check max attempts
        if (verification.getAttemptCount() >= MAX_VERIFY_ATTEMPTS) {
            throw new RateLimitExceededException("Maximum OTP verification attempts exceeded. Please request a new OTP.");
        }

        // Increment attempt count
        verification.setAttemptCount(verification.getAttemptCount() + 1);
        otpRepository.save(verification);

        // Check if expired
        if (verification.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidOperationException("OTP has expired. Please request a new one.");
        }

        // Check if OTP matches using BCrypt
        if (!passwordEncoder.matches(otpCode, verification.getOtpCode())) {
            throw new InvalidOperationException("Invalid OTP. Please try again. Attempts remaining: "
                    + (MAX_VERIFY_ATTEMPTS - verification.getAttemptCount()));
        }

        // Mark as verified
        verification.setIsVerified(true);
        otpRepository.save(verification);
        return true;
    }

    /**
     * Checks if an email has been verified via OTP.
     */
    public boolean isEmailVerified(String email) {
        return otpRepository.findTopByEmailAndIsVerifiedFalseOrderByCreatedAtDesc(email).isEmpty();
    }
}
