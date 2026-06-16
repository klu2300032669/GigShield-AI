package com.gigshield.service;

import com.gigshield.dto.PaymentRequestDTO;
import com.gigshield.dto.PaymentResponseDTO;

public interface PaymentService {
    
    /**
     * Initializes a payment intent/order with the payment gateway.
     */
    PaymentResponseDTO createPaymentIntent(PaymentRequestDTO request);

    /**
     * Verifies a successful payment via webhook or direct verification.
     */
    boolean verifyPayment(String paymentIntentId, String signature, String payload);
}
