package com.gigshield.repository;

import com.gigshield.model.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {
    Optional<OtpVerification> findTopByEmailAndIsVerifiedFalseOrderByCreatedAtDesc(String email);
    void deleteByEmail(String email);

    // Rate limiting: count recent OTP requests for a given email
    long countByEmailAndCreatedAtAfter(String email, LocalDateTime since);
}
