package com.gigshield.controller;

import com.gigshield.dto.*;
import com.gigshield.service.OtpService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/otp")
@RequiredArgsConstructor
@Tag(name = "OTP", description = "OTP generation and verification for email verification")
public class OtpController {

    private final OtpService otpService;

    /**
     * Send OTP to the provided email address.
     * In production this sends via email/SMS; for demo the OTP is logged to console.
     */
    @PostMapping("/send")
    @Operation(summary = "Send OTP to email", description = "Rate limited to 5 requests per 15 minutes per email")
    public ResponseEntity<ApiResponse<String>> sendOtp(@Valid @RequestBody OtpRequestDTO dto) {
        String otp = otpService.generateOtp(dto.getEmail());
        // In demo mode, we return the OTP in response for testing
        return ResponseEntity.ok(ApiResponse.success(
                "OTP sent successfully to " + dto.getEmail() + ". Check backend console for the code.",
                otp
        ));
    }

    /**
     * Verify OTP entered by the user.
     */
    @PostMapping("/verify")
    @Operation(summary = "Verify OTP code")
    public ResponseEntity<ApiResponse<Boolean>> verifyOtp(@Valid @RequestBody OtpVerifyDTO dto) {
        boolean verified = otpService.verifyOtp(dto.getEmail(), dto.getOtpCode());
        return ResponseEntity.ok(ApiResponse.success("OTP verified successfully", verified));
    }
}
