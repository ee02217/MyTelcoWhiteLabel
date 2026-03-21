package com.mytelco.customerbff.analytics;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record ProductAnalyticsDashboardResponse(
    Instant generatedAt,
    long totalEvents,
    List<ProductAnalyticsFunnelMetric> funnelMetrics,
    Map<String, Long> totalsByOperator,
    Map<String, Long> totalsByChannel,
    List<ProductAnalyticsEvent> recentEvents
) {
}
