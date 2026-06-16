package com.gigshield.controller;

import com.gigshield.dto.*;
import com.gigshield.model.InsurancePlan;
import com.gigshield.service.PolicyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/policies")
@RequiredArgsConstructor
@Tag(name = "Policies", description = "Insurance policy and plan management")
public class PolicyController {

    private final PolicyService policyService;

    @GetMapping("/plans")
    @Operation(summary = "Get all active insurance plans")
    public ResponseEntity<ApiResponse<List<InsurancePlan>>> getAllPlans() {
        List<InsurancePlan> plans = policyService.getAllActivePlans();
        return ResponseEntity.ok(ApiResponse.success(plans));
    }

    @GetMapping("/plans/{id}")
    @Operation(summary = "Get insurance plan by ID")
    public ResponseEntity<ApiResponse<InsurancePlan>> getPlan(@PathVariable Long id) {
        InsurancePlan plan = policyService.getPlanById(id);
        return ResponseEntity.ok(ApiResponse.success(plan));
    }

    @PostMapping("/purchase")
    @Operation(summary = "Purchase a new insurance policy")
    public ResponseEntity<ApiResponse<PolicyResponseDTO>> purchasePolicy(@Valid @RequestBody PolicyRequestDTO dto) {
        PolicyResponseDTO policy = policyService.purchasePolicy(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Policy purchased successfully", policy));
    }

    @GetMapping("/worker/{workerId}")
    @Operation(summary = "Get all policies for a worker")
    public ResponseEntity<ApiResponse<PageResponse<PolicyResponseDTO>>> getWorkerPolicies(
            @PathVariable Long workerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<PolicyResponseDTO> policies = policyService.getWorkerPolicies(workerId, page, size);
        return ResponseEntity.ok(ApiResponse.success(policies));
    }

    @PutMapping("/{id}/cancel")
    @Operation(summary = "Cancel an active policy")
    public ResponseEntity<ApiResponse<PolicyResponseDTO>> cancelPolicy(@PathVariable Long id) {
        PolicyResponseDTO policy = policyService.cancelPolicy(id);
        return ResponseEntity.ok(ApiResponse.success("Policy cancelled successfully", policy));
    }
}
