package com.gigshield.controller;

import com.gigshield.dto.*;
import com.gigshield.security.JwtUtil;
import com.gigshield.service.WorkerService;
import com.gigshield.service.OtpService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/workers")
@RequiredArgsConstructor
@Tag(name = "Workers", description = "Worker registration, login, and profile management")
public class WorkerController {

    private final WorkerService workerService;
    private final OtpService otpService;
    private final JwtUtil jwtUtil;

    @PostMapping("/register")
    @Operation(summary = "Register a new worker", description = "Creates a worker account with WORKER role. Requires OTP email verification.")
    public ResponseEntity<ApiResponse<WorkerResponseDTO>> register(@Valid @RequestBody WorkerRegistrationDTO dto) {
        WorkerResponseDTO worker = workerService.register(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Worker registered successfully. Please verify your email with OTP.", worker));
    }

    @PostMapping("/verify-email")
    @Operation(summary = "Verify email with OTP")
    public ResponseEntity<ApiResponse<String>> verifyEmail(@Valid @RequestBody OtpVerifyDTO dto) {
        otpService.verifyOtp(dto.getEmail(), dto.getOtpCode());
        workerService.markEmailVerified(dto.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Email verified successfully", "verified"));
    }

    @PostMapping("/login")
    @Operation(summary = "Login with email and password", description = "Returns JWT access and refresh tokens on success")
    public ResponseEntity<ApiResponse<JwtAuthResponse>> login(@Valid @RequestBody WorkerLoginDTO dto) {
        WorkerResponseDTO worker = workerService.login(dto);
        String accessToken = jwtUtil.generateAccessToken(worker.getId(), worker.getEmail(), worker.getRole());
        String refreshToken = jwtUtil.generateRefreshToken(worker.getId(), worker.getEmail());

        JwtAuthResponse authResponse = JwtAuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtUtil.getAccessTokenExpiration() / 1000)
                .user(worker)
                .build();

        return ResponseEntity.ok(ApiResponse.success("Login successful", authResponse));
    }

    @PostMapping("/refresh-token")
    @Operation(summary = "Refresh access token", description = "Use a valid refresh token to get a new access token")
    public ResponseEntity<ApiResponse<JwtAuthResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();

        if (!jwtUtil.validateToken(refreshToken)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.<JwtAuthResponse>builder()
                            .success(false)
                            .message("Invalid or expired refresh token")
                            .build());
        }

        String tokenType = jwtUtil.extractTokenType(refreshToken);
        if (!"REFRESH".equals(tokenType)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.<JwtAuthResponse>builder()
                            .success(false)
                            .message("Invalid token type. Expected refresh token.")
                            .build());
        }

        Long userId = jwtUtil.extractUserId(refreshToken);
        String email = jwtUtil.extractEmail(refreshToken);
        WorkerResponseDTO worker = workerService.getWorkerById(userId);

        String newAccessToken = jwtUtil.generateAccessToken(userId, email, worker.getRole());
        String newRefreshToken = jwtUtil.generateRefreshToken(userId, email);

        JwtAuthResponse authResponse = JwtAuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtUtil.getAccessTokenExpiration() / 1000)
                .user(worker)
                .build();

        return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", authResponse));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get worker profile by ID")
    public ResponseEntity<ApiResponse<WorkerResponseDTO>> getWorker(@PathVariable Long id) {
        WorkerResponseDTO worker = workerService.getWorkerById(id);
        return ResponseEntity.ok(ApiResponse.success(worker));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update worker profile")
    public ResponseEntity<ApiResponse<WorkerResponseDTO>> updateWorker(
            @PathVariable Long id, @Valid @RequestBody WorkerRegistrationDTO dto) {
        WorkerResponseDTO worker = workerService.updateWorker(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Worker updated successfully", worker));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Reset password", description = "Verifies the OTP and updates the password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(@Valid @RequestBody ForgotPasswordDTO dto) {
        otpService.verifyOtp(dto.getEmail(), dto.getOtpCode());
        workerService.resetPassword(dto);
        return ResponseEntity.ok(ApiResponse.success("Password reset successfully", "success"));
    }

    @GetMapping("/{id}/dashboard")
    @Operation(summary = "Get worker dashboard data", description = "Returns policies, claims, payouts, and statistics for a worker")
    public ResponseEntity<ApiResponse<DashboardDTO>> getDashboard(@PathVariable Long id) {
        DashboardDTO dashboard = workerService.getDashboard(id);
        return ResponseEntity.ok(ApiResponse.success(dashboard));
    }
}
