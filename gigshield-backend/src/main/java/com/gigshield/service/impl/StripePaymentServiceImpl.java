package com.gigshield.service.impl;

import com.gigshield.dto.PaymentRequestDTO;
import com.gigshield.dto.PaymentResponseDTO;
import com.gigshield.service.PaymentService;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class StripePaymentServiceImpl implements PaymentService {

    @Value("${stripe.api.key}")
    private String stripeApiKey;

    @Value("${stripe.webhook.secret}")
    private String webhookSecret;

    @Value("${stripe.currency:inr}")
    private String defaultCurrency;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeApiKey;
        log.info("✅ Stripe Payment Gateway initialized (currency: {})", defaultCurrency.toUpperCase());
    }

    @Override
    public PaymentResponseDTO createPaymentIntent(PaymentRequestDTO request) {
        log.info("Creating Stripe PaymentIntent for worker {}, amount {} {}",
                request.getWorkerId(), request.getAmount(), 
                request.getCurrency() != null ? request.getCurrency() : defaultCurrency);

        try {
            // Stripe expects amount in the smallest currency unit (paise for INR, cents for USD)
            long amountInSmallestUnit = request.getAmount()
                    .multiply(java.math.BigDecimal.valueOf(100))
                    .longValue();

            String currency = request.getCurrency() != null 
                    ? request.getCurrency().toLowerCase() 
                    : defaultCurrency;

            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amountInSmallestUnit)
                    .setCurrency(currency)
                    .addPaymentMethodType("card")
                    .putMetadata("worker_id", String.valueOf(request.getWorkerId()))
                    .putMetadata("policy_id", String.valueOf(request.getPolicyId()))
                    .setDescription("GigShield Insurance Premium — Worker #" + request.getWorkerId())
                    .build();

            PaymentIntent intent = PaymentIntent.create(params);

            log.info("✅ PaymentIntent created: {} (status: {})", intent.getId(), intent.getStatus());

            return PaymentResponseDTO.builder()
                    .paymentIntentId(intent.getId())
                    .clientSecret(intent.getClientSecret())
                    .status(intent.getStatus().toUpperCase())
                    .build();

        } catch (StripeException e) {
            log.error("❌ Stripe PaymentIntent creation failed: {}", e.getMessage());
            return PaymentResponseDTO.builder()
                    .status("FAILED")
                    .errorMessage(e.getMessage())
                    .build();
        }
    }

    @Override
    public boolean verifyPayment(String paymentIntentId, String signature, String payload) {
        log.info("Verifying Stripe webhook signature for event");

        try {
            // Verify the webhook signature using Stripe's SDK
            Webhook.constructEvent(payload, signature, webhookSecret);
            log.info("✅ Stripe webhook signature verified successfully");
            return true;
        } catch (SignatureVerificationException e) {
            log.error("❌ Stripe webhook signature verification failed: {}", e.getMessage());
            return false;
        }
    }
}
