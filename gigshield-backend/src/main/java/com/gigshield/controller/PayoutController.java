package com.gigshield.controller;

import com.gigshield.dto.*;
import com.gigshield.service.PayoutService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.util.Map;

@RestController
@RequestMapping("/api/v1/payouts")
@RequiredArgsConstructor
@Tag(name = "Payouts", description = "Payout tracking and completion")
public class PayoutController {

    private final PayoutService payoutService;

    @GetMapping("/worker/{workerId}")
    public ResponseEntity<ApiResponse<PageResponse<PayoutResponseDTO>>> getWorkerPayouts(
            @PathVariable Long workerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<PayoutResponseDTO> payouts = payoutService.getWorkerPayouts(workerId, page, size);
        return ResponseEntity.ok(ApiResponse.success(payouts));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PayoutResponseDTO>> getPayout(@PathVariable Long id) {
        PayoutResponseDTO payout = payoutService.getPayoutById(id);
        return ResponseEntity.ok(ApiResponse.success(payout));
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<PayoutResponseDTO>> completePayout(
            @PathVariable Long id, @RequestBody Map<String, String> request) {
        String transactionRef = request.get("transactionRef");
        PayoutResponseDTO payout = payoutService.completePayout(id, transactionRef);
        return ResponseEntity.ok(ApiResponse.success("Payout completed successfully", payout));
    }
}
