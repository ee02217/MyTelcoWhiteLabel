package com.mytelco.customerbff.service;

import com.mytelco.customerbff.model.AlertThresholdConfig;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ThresholdConfigService {

    private static final List<Integer> DEFAULT_THRESHOLDS = List.of(80, 100);

    private final Map<String, AlertThresholdConfig> perCustomerConfig = new ConcurrentHashMap<>();
    private final long dedupTtlMinutes;

    public ThresholdConfigService(@Value("${alerts.dedup.ttl-minutes:360}") long dedupTtlMinutes) {
        this.dedupTtlMinutes = dedupTtlMinutes;
    }

    public AlertThresholdConfig getConfig(String customerId) {
        return perCustomerConfig.computeIfAbsent(customerId, this::defaultConfig);
    }

    public AlertThresholdConfig updateConfig(String customerId, List<Integer> thresholds, String actor) {
        List<Integer> normalized = thresholds.stream()
            .filter(v -> v != null && v > 0 && v <= 100)
            .distinct()
            .sorted(Comparator.naturalOrder())
            .toList();

        if (normalized.isEmpty()) {
            normalized = DEFAULT_THRESHOLDS;
        }

        AlertThresholdConfig updated = new AlertThresholdConfig(customerId, normalized, dedupTtlMinutes, Instant.now(), actor);
        perCustomerConfig.put(customerId, updated);
        return updated;
    }

    private AlertThresholdConfig defaultConfig(String customerId) {
        return new AlertThresholdConfig(customerId, DEFAULT_THRESHOLDS, dedupTtlMinutes, Instant.now(), "system");
    }
}
