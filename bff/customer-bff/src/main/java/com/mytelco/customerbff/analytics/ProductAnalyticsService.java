package com.mytelco.customerbff.analytics;

import com.mytelco.customerbff.events.DomainEventPublisher;
import com.mytelco.customerbff.events.EventTopic;
import com.mytelco.customerbff.operator.OperatorContextResolver;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

@Service
public class ProductAnalyticsService {

    private static final int DEFAULT_DASHBOARD_LIMIT = 200;
    private static final int MAX_DASHBOARD_LIMIT = 500;
    private static final int MAX_RETAINED_EVENTS = 5000;

    private static final List<ProductAnalyticsTaxonomyEntry> TAXONOMY = List.of(
        new ProductAnalyticsTaxonomyEntry(
            "auth.login.success",
            "login",
            "success",
            "Customer authenticated and reached dashboard/account overview",
            "product-analytics"
        ),
        new ProductAnalyticsTaxonomyEntry(
            "billing.billpay.checkout.started",
            "bill_pay",
            "checkout_started",
            "Customer started bill payment checkout",
            "product-analytics"
        ),
        new ProductAnalyticsTaxonomyEntry(
            "billing.billpay.checkout.completed",
            "bill_pay",
            "checkout_completed",
            "Bill payment checkout completed (success/failure)",
            "product-analytics"
        ),
        new ProductAnalyticsTaxonomyEntry(
            "plan_change.selection.confirmed",
            "plan_change",
            "selection_confirmed",
            "Customer confirmed offer selection before order submission",
            "product-analytics"
        ),
        new ProductAnalyticsTaxonomyEntry(
            "support.case.created",
            "support_case",
            "case_created",
            "Customer created support case",
            "product-analytics"
        )
    );

    private final DomainEventPublisher eventPublisher;
    private final OperatorContextResolver operatorContextResolver;
    private final MeterRegistry meterRegistry;

    private final CopyOnWriteArrayList<ProductAnalyticsEvent> events = new CopyOnWriteArrayList<>();

    public ProductAnalyticsService(
        DomainEventPublisher eventPublisher,
        OperatorContextResolver operatorContextResolver,
        MeterRegistry meterRegistry
    ) {
        this.eventPublisher = eventPublisher;
        this.operatorContextResolver = operatorContextResolver;
        this.meterRegistry = meterRegistry;
    }

    public List<ProductAnalyticsTaxonomyEntry> taxonomy() {
        return TAXONOMY;
    }

    public void trackLoginSuccess(
        String customerId,
        String operatorHint,
        String channelHint,
        String correlationId
    ) {
        track(
            "auth.login.success",
            customerId,
            operatorHint,
            channelHint,
            correlationId,
            "SUCCESS",
            Map.of()
        );
    }

    public void trackBillPayCheckoutStarted(
        String customerId,
        String operatorHint,
        String channelHint,
        String correlationId,
        String billReference,
        String idempotencyKey,
        String currency,
        String amount
    ) {
        track(
            "billing.billpay.checkout.started",
            customerId,
            operatorHint,
            channelHint,
            correlationId,
            "STARTED",
            Map.of(
                "billReference", billReference,
                "idempotencyKey", idempotencyKey,
                "currency", currency,
                "amount", amount
            )
        );
    }

    public void trackBillPayCheckoutCompleted(
        String customerId,
        String operatorHint,
        String channelHint,
        String correlationId,
        String billReference,
        String checkoutStatus,
        String transactionId
    ) {
        track(
            "billing.billpay.checkout.completed",
            customerId,
            operatorHint,
            channelHint,
            correlationId,
            normalizeOutcome(checkoutStatus),
            Map.of(
                "billReference", billReference,
                "checkoutStatus", checkoutStatus,
                "transactionId", transactionId
            )
        );
    }

    public void trackPlanChangeConfirmed(
        String customerId,
        String operatorHint,
        String channelHint,
        String correlationId,
        String lineId,
        int selectedOfferCount,
        boolean termsAccepted
    ) {
        track(
            "plan_change.selection.confirmed",
            customerId,
            operatorHint,
            channelHint,
            correlationId,
            termsAccepted ? "SUCCESS" : "FAILED",
            Map.of(
                "lineId", lineId,
                "selectedOfferCount", selectedOfferCount,
                "termsAccepted", termsAccepted
            )
        );
    }

    public void trackSupportCaseCreated(
        String customerId,
        String operatorHint,
        String channelHint,
        String correlationId,
        String caseId,
        String category,
        String priority
    ) {
        track(
            "support.case.created",
            customerId,
            operatorHint,
            channelHint,
            correlationId,
            "SUCCESS",
            Map.of(
                "caseId", caseId,
                "category", category,
                "priority", priority
            )
        );
    }

    public ProductAnalyticsDashboardResponse dashboard(String operatorId, String channel, Integer limit) {
        String normalizedOperatorFilter = normalizeOptional(operatorId);
        String normalizedChannelFilter = normalizeOptional(channel);
        int normalizedLimit = normalizeLimit(limit);

        List<ProductAnalyticsEvent> filtered = events.stream()
            .filter(event -> normalizedOperatorFilter == null
                || event.operatorId().equalsIgnoreCase(normalizedOperatorFilter))
            .filter(event -> normalizedChannelFilter == null
                || event.channel().equalsIgnoreCase(normalizedChannelFilter))
            .sorted(Comparator.comparing(ProductAnalyticsEvent::occurredAt).reversed())
            .limit(normalizedLimit)
            .toList();

        Map<String, Long> totalsByOperator = filtered.stream()
            .collect(Collectors.groupingBy(
                ProductAnalyticsEvent::operatorId,
                LinkedHashMap::new,
                Collectors.counting()
            ));

        Map<String, Long> totalsByChannel = filtered.stream()
            .collect(Collectors.groupingBy(
                ProductAnalyticsEvent::channel,
                LinkedHashMap::new,
                Collectors.counting()
            ));

        Map<String, Long> grouped = new LinkedHashMap<>();
        for (ProductAnalyticsEvent event : filtered) {
            String key = event.funnel() + "|" + event.step() + "|" + event.eventType() + "|" + event.outcome();
            grouped.merge(key, 1L, Long::sum);
        }

        List<ProductAnalyticsFunnelMetric> funnelMetrics = new ArrayList<>();
        grouped.forEach((key, count) -> {
            String[] parts = key.split("\\|", 4);
            funnelMetrics.add(new ProductAnalyticsFunnelMetric(
                parts[0],
                parts[1],
                parts[2],
                parts[3],
                count
            ));
        });
        funnelMetrics.sort(Comparator
            .comparing(ProductAnalyticsFunnelMetric::funnel)
            .thenComparing(ProductAnalyticsFunnelMetric::step)
            .thenComparing(ProductAnalyticsFunnelMetric::eventType)
            .thenComparing(ProductAnalyticsFunnelMetric::outcome));

        return new ProductAnalyticsDashboardResponse(
            Instant.now(),
            filtered.size(),
            funnelMetrics,
            totalsByOperator,
            totalsByChannel,
            filtered
        );
    }

    private void track(
        String eventType,
        String customerId,
        String operatorHint,
        String channelHint,
        String correlationId,
        String outcome,
        Map<String, Object> attributes
    ) {
        ProductAnalyticsTaxonomyEntry taxonomyEntry = taxonomyByEventType(eventType);
        String normalizedCustomerId = StringUtils.hasText(customerId) ? customerId.trim() : "anonymous";
        String normalizedOperatorId = resolveOperatorId(normalizedCustomerId, operatorHint);
        String normalizedChannel = resolveChannel(channelHint);
        String normalizedCorrelationId = resolveCorrelationId(correlationId);
        String normalizedOutcome = normalizeOutcome(outcome);

        ProductAnalyticsEvent event = new ProductAnalyticsEvent(
            eventType,
            taxonomyEntry.funnel(),
            taxonomyEntry.step(),
            normalizedOutcome,
            normalizedCustomerId,
            normalizedOperatorId,
            normalizedChannel,
            normalizedCorrelationId,
            Instant.now(),
            attributes == null ? Map.of() : attributes
        );

        events.add(event);
        trimEvents();

        meterRegistry.counter(
            "mytelco.product.analytics.events",
            "event_type", event.eventType(),
            "funnel", event.funnel(),
            "step", event.step(),
            "operator_id", event.operatorId(),
            "channel", event.channel(),
            "outcome", event.outcome()
        ).increment();

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("eventType", event.eventType());
        payload.put("funnel", event.funnel());
        payload.put("step", event.step());
        payload.put("outcome", event.outcome());
        payload.put("operatorId", event.operatorId());
        payload.put("channel", event.channel());
        payload.put("occurredAt", event.occurredAt().toString());
        payload.putAll(event.attributes());

        eventPublisher.publish(
            EventTopic.ANALYTICS,
            event.eventType(),
            event.customerId(),
            event.correlationId(),
            payload
        );
    }

    private ProductAnalyticsTaxonomyEntry taxonomyByEventType(String eventType) {
        return TAXONOMY.stream()
            .filter(entry -> entry.eventType().equals(eventType))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Unknown analytics event type: " + eventType));
    }

    private String resolveOperatorId(String customerId, String operatorHint) {
        if (StringUtils.hasText(operatorHint)) {
            return operatorHint.trim();
        }
        return operatorContextResolver.resolveOperatorId(customerId);
    }

    private String resolveChannel(String channelHint) {
        if (!StringUtils.hasText(channelHint)) {
            return "web";
        }
        return channelHint.trim().toLowerCase(Locale.ROOT);
    }

    private String resolveCorrelationId(String correlationId) {
        if (StringUtils.hasText(correlationId)) {
            return correlationId.trim();
        }
        return UUID.randomUUID().toString();
    }

    private String normalizeOutcome(String outcome) {
        if (!StringUtils.hasText(outcome)) {
            return "UNKNOWN";
        }
        return outcome.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeOptional(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private int normalizeLimit(Integer limit) {
        if (limit == null || limit < 1) {
            return DEFAULT_DASHBOARD_LIMIT;
        }
        return Math.min(limit, MAX_DASHBOARD_LIMIT);
    }

    private void trimEvents() {
        int overflow = events.size() - MAX_RETAINED_EVENTS;
        if (overflow <= 0) {
            return;
        }
        for (int i = 0; i < overflow; i++) {
            events.remove(0);
        }
    }
}
