package com.mytelco.customerbff.analytics;

public record ProductAnalyticsTaxonomyEntry(
    String eventType,
    String funnel,
    String step,
    String description,
    String owner
) {
}
