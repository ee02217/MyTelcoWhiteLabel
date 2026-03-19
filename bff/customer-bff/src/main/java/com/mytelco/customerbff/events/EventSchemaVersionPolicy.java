package com.mytelco.customerbff.events;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.stereotype.Component;

@Component
public class EventSchemaVersionPolicy {

    private static final Map<String, Integer> BASELINE_EVENT_VERSIONS = Map.ofEntries(
        Map.entry("usage.details.requested.v1", 1),
        Map.entry("usage.threshold.crossed.v1", 1),
        Map.entry("billing.explorer.viewed.v1", 1),
        Map.entry("payment.method.registered.v1", 1),
        Map.entry("payment.checkout.processed.v1", 1),
        Map.entry("payment.checkout.replayed.v1", 1),
        Map.entry("payment.retry.processed.v1", 1),
        Map.entry("order.state.changed.v1", 1),
        Map.entry("notification.preferences.updated.v1", 1),
        Map.entry("notification.test.sent.v1", 1)
    );

    private final EventBackboneProperties properties;

    public EventSchemaVersionPolicy(EventBackboneProperties properties) {
        this.properties = properties;
    }

    public int versionForEventType(String eventType) {
        Integer override = properties.getSchema().getVersions().get(eventType);
        if (override != null) {
            return override;
        }
        Integer baseline = BASELINE_EVENT_VERSIONS.get(eventType);
        if (baseline != null) {
            return baseline;
        }
        return properties.getSchema().getDefaultVersion();
    }

    public Map<String, Integer> effectivePolicy() {
        Map<String, Integer> effective = new LinkedHashMap<>();
        effective.putAll(BASELINE_EVENT_VERSIONS);
        effective.putAll(properties.getSchema().getVersions());
        return effective;
    }
}
