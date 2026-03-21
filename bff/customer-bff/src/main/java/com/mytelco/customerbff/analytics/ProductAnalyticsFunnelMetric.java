package com.mytelco.customerbff.analytics;

public record ProductAnalyticsFunnelMetric(
    String funnel,
    String step,
    String eventType,
    String outcome,
    long count
) {
}
