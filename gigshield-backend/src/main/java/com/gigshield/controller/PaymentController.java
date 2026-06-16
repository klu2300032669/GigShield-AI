package com.gigshield.controller;

import com.gigshield.dto.ApiResponse;
import com.gigshield.dto.PaymentRequestDTO;
import com.gigshield.dto.PaymentResponseDTO;
import com.gigshield.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Tag(name = "Payment Management", description = "Endpoints for handling payments")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create-intent")
    @Operation(summary = "Create a payment intent for a policy premium")
    public ResponseEntity<ApiResponse<PaymentResponseDTO>> createPaymentIntent(
            @RequestBody PaymentRequestDTO request) {
        
        PaymentResponseDTO response = paymentService.createPaymentIntent(request);
        return ResponseEntity.ok(ApiResponse.success("Payment intent created", response));
    }

    @PostMapping("/webhook")
    @Operation(summary = "Webhook endpoint for payment gateway events")
    public ResponseEntity<String> stripeWebhook(
            @RequestHeader("Stripe-Signature") String sigHeader,
            @RequestBody String payload) {
        
        // Use an intentId from the payload in reality
        boolean isValid = paymentService.verifyPayment("webhook_event", sigHeader, payload);
        
        if (isValid) {
            return ResponseEntity.ok("Success");
        } else {
            return ResponseEntity.badRequest().body("Signature verification failed");
        }
    }
}
