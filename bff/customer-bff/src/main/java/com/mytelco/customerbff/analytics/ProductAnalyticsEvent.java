package com.mytelco.customerbff.analytics;

import java.time.Instant;
import java.util.Map;

public record ProductAnalyticsEvent(
    String eventType,
    String funnel,
    String step,
    String outcome,
    String customerId,
    String operatorId,
    String channel,
    String correlationId,
    Instant occurredAt,
    Map<String, Object> attributes
) {
}
