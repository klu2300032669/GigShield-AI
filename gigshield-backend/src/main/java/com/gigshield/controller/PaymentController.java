package com.gigshield.controller;

import com.gigshield.dto.ApiResponse;
import com.gigshield.dto.PaymentRequestDTO;
import com.gigshield.dto.PaymentResponseDTO;
import com.gigshield.service.PaymentService;
import com.gigshield.service.PolicyService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Payment Management", description = "Endpoints for handling payments via Stripe")
public class PaymentController {

    private final PaymentService paymentService;
    private final PolicyService policyService;

    @Value("${stripe.webhook.secret}")
    private String webhookSecret;

    @PostMapping("/create-intent")
    @Operation(summary = "Create a Stripe PaymentIntent for a policy premium")
    public ResponseEntity<ApiResponse<PaymentResponseDTO>> createPaymentIntent(
            @RequestBody PaymentRequestDTO request) {

        PaymentResponseDTO response = paymentService.createPaymentIntent(request);

        if ("FAILED".equals(response.getStatus())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(response.getErrorMessage()));
        }

        return ResponseEntity.ok(ApiResponse.success("Payment intent created", response));
    }

    @PostMapping("/webhook")
    @Operation(summary = "Stripe webhook endpoint — receives asynchronous payment events")
    public ResponseEntity<String> stripeWebhook(
            @RequestHeader(value = "Stripe-Signature", required = false) String sigHeader,
            @RequestBody String payload) {

        if (sigHeader == null || sigHeader.isBlank()) {
            log.warn("Stripe webhook called without Stripe-Signature header");
            return ResponseEntity.badRequest().body("Missing Stripe-Signature header");
        }

        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (SignatureVerificationException e) {
            log.error("❌ Stripe webhook signature verification failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Signature verification failed");
        }

        // Handle the event
        switch (event.getType()) {
            case "payment_intent.succeeded":
                log.info("✅ Payment succeeded event received: {}", event.getId());
                // The frontend already creates the policy after confirmCardPayment succeeds,
                // but this serves as a safety net for server-side confirmation.
                break;

            case "payment_intent.payment_failed":
                log.warn("❌ Payment failed event received: {}", event.getId());
                break;

            default:
                log.info("Unhandled Stripe event type: {}", event.getType());
        }

        return ResponseEntity.ok("Received");
    }
}
