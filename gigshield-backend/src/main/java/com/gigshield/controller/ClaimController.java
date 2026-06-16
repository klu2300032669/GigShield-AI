package com.gigshield.controller;

import com.gigshield.dto.*;
import com.gigshield.service.ClaimService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/claims")
@RequiredArgsConstructor
@Tag(name = "Claims", description = "Insurance claim management and AI-powered claim triggering")
public class ClaimController {

    private final ClaimService claimService;

    @GetMapping("/worker/{workerId}")
    @Operation(summary = "Get all claims for a worker")
    public ResponseEntity<ApiResponse<PageResponse<ClaimResponseDTO>>> getWorkerClaims(
            @PathVariable Long workerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<ClaimResponseDTO> claims = claimService.getWorkerClaims(workerId, page, size);
        return ResponseEntity.ok(ApiResponse.success(claims));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get claim by ID")
    public ResponseEntity<ApiResponse<ClaimResponseDTO>> getClaim(@PathVariable Long id) {
        ClaimResponseDTO claim = claimService.getClaimById(id);
        return ResponseEntity.ok(ApiResponse.success(claim));
    }

    /**
     * Trigger a claim evaluation, calling the AI Service for risk prediction.
     * Expects: policyId, eventId, estimatedLoss, onlineHours, completedDeliveries
     */
    @PostMapping("/trigger")
    @Operation(summary = "Trigger AI-powered claim evaluation", description = "Calls the Python AI service for real-time risk prediction and fraud detection")
    public ResponseEntity<ApiResponse<ClaimResponseDTO>> triggerClaim(@RequestBody Map<String, Object> request) {
        Long policyId = Long.valueOf(request.get("policyId").toString());
        Long eventId = Long.valueOf(request.get("eventId").toString());
        BigDecimal estimatedLoss = new BigDecimal(request.get("estimatedLoss").toString());
        Double onlineHours = Double.valueOf(request.get("onlineHours").toString());
        Integer completedDeliveries = Integer.valueOf(request.get("completedDeliveries").toString());

        ClaimResponseDTO claim = claimService.triggerClaim(policyId, eventId, estimatedLoss, onlineHours, completedDeliveries);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Claim triggered successfully", claim));
    }
}
