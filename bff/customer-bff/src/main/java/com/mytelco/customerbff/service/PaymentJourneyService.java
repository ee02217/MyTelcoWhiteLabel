package com.mytelco.customerbff.service;

import com.mytelco.customerbff.events.DomainEventPublisher;
import com.mytelco.customerbff.events.EventTopic;
import com.mytelco.customerbff.events.NoopDomainEventPublisher;
import com.mytelco.customerbff.model.CheckoutRequest;
import com.mytelco.customerbff.model.CheckoutResponse;
import com.mytelco.customerbff.model.PaymentMethodRegistrationRequest;
import com.mytelco.customerbff.model.PaymentMethodRegistrationResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PaymentJourneyService {

    private final Map<String, String> tokenToPaymentMethod = new ConcurrentHashMap<>();
    private final Map<String, CheckoutResponse> idempotencyResponses = new ConcurrentHashMap<>();
    private DomainEventPublisher domainEventPublisher = NoopDomainEventPublisher.INSTANCE;

    @Autowired(required = false)
    public void setDomainEventPublisher(DomainEventPublisher domainEventPublisher) {
        this.domainEventPublisher = domainEventPublisher;
    }

    public PaymentMethodRegistrationResponse registerPaymentMethod(PaymentMethodRegistrationRequest request) {
        String paymentMethodId = "pm_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        String token = "tok_" + UUID.randomUUID().toString().replace("-", "").substring(0, 20);
        tokenToPaymentMethod.put(token, paymentMethodId);

        PaymentMethodRegistrationResponse response = new PaymentMethodRegistrationResponse(paymentMethodId, token, "REGISTERED");

        domainEventPublisher.publish(
            EventTopic.PAYMENT,
            "payment.method.registered.v1",
            "unknown",
            paymentMethodId,
            Map.of(
                "paymentMethodId", response.paymentMethodId(),
                "status", response.status()
            )
        );

        return response;
    }

    public CheckoutResponse checkout(CheckoutRequest request, String idempotencyKey) {
        CheckoutResponse existing = idempotencyResponses.get(idempotencyKey);
        if (existing != null) {
            publishPaymentReplay(existing);
            return existing;
        }

        CheckoutResponse generated = buildCheckoutResponse(request, idempotencyKey);
        CheckoutResponse prior = idempotencyResponses.putIfAbsent(idempotencyKey, generated);
        CheckoutResponse response = prior != null ? prior : generated;

        if (prior != null) {
            publishPaymentReplay(prior);
        } else {
            publishPaymentProcessed(request, generated);
        }

        return response;
    }

    private void publishPaymentProcessed(CheckoutRequest request, CheckoutResponse response) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("transactionId", response.transactionId());
        payload.put("status", response.status());
        payload.put("message", response.message());
        payload.put("idempotencyKey", response.idempotencyKey());
        payload.put("billReference", request.billReference());
        payload.put("amount", request.amount());
        payload.put("currency", request.currency());

        domainEventPublisher.publish(
            EventTopic.PAYMENT,
            "payment.checkout.processed.v1",
            "unknown",
            response.idempotencyKey(),
            payload
        );
    }

    private void publishPaymentReplay(CheckoutResponse response) {
        domainEventPublisher.publish(
            EventTopic.PAYMENT,
            "payment.checkout.replayed.v1",
            "unknown",
            response.idempotencyKey(),
            Map.of(
                "transactionId", response.transactionId(),
                "status", response.status(),
                "idempotencyKey", response.idempotencyKey()
            )
        );
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
