package com.mytelco.customerbff.service;

import com.mytelco.customerbff.model.CheckoutRequest;
import com.mytelco.customerbff.model.CheckoutResponse;
import com.mytelco.customerbff.model.PaymentMethodRegistrationRequest;
import com.mytelco.customerbff.model.PaymentMethodRegistrationResponse;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PaymentJourneyService {

    private final Map<String, String> tokenToPaymentMethod = new ConcurrentHashMap<>();
    private final Map<String, CheckoutResponse> idempotencyResponses = new ConcurrentHashMap<>();

    public PaymentMethodRegistrationResponse registerPaymentMethod(PaymentMethodRegistrationRequest request) {
        String paymentMethodId = "pm_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        String token = "tok_" + UUID.randomUUID().toString().replace("-", "").substring(0, 20);
        tokenToPaymentMethod.put(token, paymentMethodId);
        return new PaymentMethodRegistrationResponse(paymentMethodId, token, "REGISTERED");
    }

    public CheckoutResponse checkout(CheckoutRequest request, String idempotencyKey) {
        CheckoutResponse existing = idempotencyResponses.get(idempotencyKey);
        if (existing != null) {
            return existing;
        }

        CheckoutResponse generated = buildCheckoutResponse(request, idempotencyKey);
        CheckoutResponse prior = idempotencyResponses.putIfAbsent(idempotencyKey, generated);
        return prior != null ? prior : generated;
    }

    private CheckoutResponse buildCheckoutResponse(CheckoutRequest request, String idempotencyKey) {
        if (!tokenToPaymentMethod.containsKey(request.paymentMethodToken())) {
            return new CheckoutResponse(
                "tx_" + Instant.now().toEpochMilli(),
                "FAILED",
                "Unknown payment method token",
                idempotencyKey
            );
        }

        if (request.amount().compareTo(BigDecimal.ZERO) <= 0) {
            return new CheckoutResponse(
                "tx_" + Instant.now().toEpochMilli(),
                "FAILED",
                "Amount must be positive",
                idempotencyKey
            );
        }

        boolean forcedFailure = "FAIL".equalsIgnoreCase(request.billReference())
            || request.amount().compareTo(new BigDecimal("500")) > 0;

        if (forcedFailure) {
            return new CheckoutResponse(
                "tx_" + Instant.now().toEpochMilli(),
                "FAILED",
                "Payment declined by provider simulator",
                idempotencyKey
            );
        }

        return new CheckoutResponse(
            "tx_" + Instant.now().toEpochMilli(),
            "SUCCESS",
            "Payment processed successfully",
            idempotencyKey
        );
    }
}
