package com.mytelco.customerbff.service;

import com.mytelco.customerbff.events.DomainEventPublisher;
import com.mytelco.customerbff.events.EventTopic;
import com.mytelco.customerbff.events.NoopDomainEventPublisher;
import com.mytelco.customerbff.model.PaymentHistoryItem;
import com.mytelco.customerbff.model.PaymentHistoryResponse;
import com.mytelco.customerbff.model.PaymentRetryResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PaymentHistoryService {

    private static final int DEFAULT_MONTHS = 12;
    private static final int MAX_MONTHS = 12;

    private final Map<String, PaymentHistoryItem> paymentsById = new ConcurrentHashMap<>();
    private final Map<String, PaymentRetryResponse> retryByIdempotencyKey = new ConcurrentHashMap<>();
    private DomainEventPublisher domainEventPublisher = NoopDomainEventPublisher.INSTANCE;

    public PaymentHistoryService() {
        seedPayments();
    }

    @Autowired(required = false)
    public void setDomainEventPublisher(DomainEventPublisher domainEventPublisher) {
        this.domainEventPublisher = domainEventPublisher;
    }

    public PaymentHistoryResponse getHistory(Integer months) {
        int boundedMonths = normalizeMonths(months);
        OffsetDateTime cutoff = OffsetDateTime.now(ZoneOffset.UTC).minusMonths(boundedMonths);

        List<PaymentHistoryItem> filtered = paymentsById.values().stream()
            .filter(payment -> !payment.paymentDate().isBefore(cutoff))
            .sorted(Comparator.comparing(PaymentHistoryItem::paymentDate).reversed())
            .toList();

        return new PaymentHistoryResponse(boundedMonths, filtered);
    }

    public Optional<PaymentHistoryItem> getPayment(String paymentId) {
        return Optional.ofNullable(paymentsById.get(paymentId));
    }

    public PaymentRetryResponse retryPayment(String paymentId, String idempotencyKeyHeader) {
        PaymentHistoryItem payment = paymentsById.get(paymentId);
        if (payment == null) {
            return new PaymentRetryResponse(paymentId, "NOT_FOUND", "Payment was not found", "");
        }

        String idempotencyKey = (idempotencyKeyHeader == null || idempotencyKeyHeader.isBlank())
            ? "retry-" + paymentId
            : idempotencyKeyHeader;

        PaymentRetryResponse existing = retryByIdempotencyKey.get(idempotencyKey);
        if (existing != null) {
            publishRetryReplay(payment, existing);
            return existing;
        }

        PaymentRetryResponse generated = buildRetryResponse(payment, idempotencyKey);
        PaymentRetryResponse prior = retryByIdempotencyKey.putIfAbsent(idempotencyKey, generated);
        PaymentRetryResponse response = prior != null ? prior : generated;

        if (prior != null) {
            publishRetryReplay(payment, prior);
        } else {
            publishRetryProcessed(payment, generated);
        }

        return response;
    }

    private void publishRetryProcessed(PaymentHistoryItem payment, PaymentRetryResponse response) {
        domainEventPublisher.publish(
            EventTopic.PAYMENT,
            "payment.retry.processed.v1",
            "unknown",
            response.idempotencyKey(),
            Map.of(
                "paymentId", payment.paymentId(),
                "referenceId", payment.referenceId(),
                "status", response.status(),
                "idempotencyKey", response.idempotencyKey()
            )
        );
    }

    private void publishRetryReplay(PaymentHistoryItem payment, PaymentRetryResponse response) {
        domainEventPublisher.publish(
            EventTopic.PAYMENT,
            "payment.retry.replayed.v1",
            "unknown",
            response.idempotencyKey(),
            Map.of(
                "paymentId", payment.paymentId(),
                "referenceId", payment.referenceId(),
                "status", response.status(),
                "idempotencyKey", response.idempotencyKey()
            )
        );
    }

    private PaymentRetryResponse buildRetryResponse(PaymentHistoryItem payment, String idempotencyKey) {
        if (!"FAILED".equalsIgnoreCase(payment.status())) {
            return new PaymentRetryResponse(
                payment.paymentId(),
                payment.status(),
                "Retry not required for non-failed payments",
                idempotencyKey
            );
        }

        PaymentHistoryItem updated = new PaymentHistoryItem(
            payment.paymentId(),
            OffsetDateTime.now(ZoneOffset.UTC),
            payment.amount(),
            payment.currency(),
            payment.methodSummary(),
            "SUCCESS",
            payment.referenceId()
        );
        paymentsById.put(payment.paymentId(), updated);

        return new PaymentRetryResponse(
            payment.paymentId(),
            "SUCCESS",
            "Retry accepted and payment completed",
            idempotencyKey
        );
    }

    private int normalizeMonths(Integer months) {
        if (months == null || months <= 0) {
            return DEFAULT_MONTHS;
        }
        return Math.min(months, MAX_MONTHS);
    }

    private void seedPayments() {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        List<PaymentHistoryItem> seed = List.of(
            new PaymentHistoryItem("pay_001", now.minusDays(12), new BigDecimal("49.99"), "EUR", "Visa •••• 4242", "SUCCESS", "INV-2026-002"),
            new PaymentHistoryItem("pay_002", now.minusMonths(1).minusDays(3), new BigDecimal("49.99"), "EUR", "Visa •••• 4242", "FAILED", "INV-2026-001"),
            new PaymentHistoryItem("pay_003", now.minusMonths(2), new BigDecimal("44.50"), "EUR", "SEPA Direct Debit", "SUCCESS", "INV-2025-012"),
            new PaymentHistoryItem("pay_004", now.minusMonths(5).minusDays(2), new BigDecimal("39.90"), "EUR", "Mastercard •••• 1111", "SUCCESS", "INV-2025-009"),
            new PaymentHistoryItem("pay_005", now.minusMonths(11), new BigDecimal("42.00"), "EUR", "Visa •••• 4242", "SUCCESS", "INV-2025-003"),
            new PaymentHistoryItem("pay_legacy", now.minusMonths(14), new BigDecimal("36.00"), "EUR", "SEPA Direct Debit", "SUCCESS", "INV-2024-010")
        );
        seed.forEach(payment -> paymentsById.put(payment.paymentId(), payment));
    }
}
