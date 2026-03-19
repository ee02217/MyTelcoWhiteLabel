package com.mytelco.customerbff.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.mytelco.customerbff.model.AlertThresholdConfig;
import com.mytelco.customerbff.service.persistence.DurableStateStore;
import com.mytelco.customerbff.service.persistence.NoopDurableStateStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ThresholdConfigService {

    private static final String STATE_KEY = "threshold-config-state";
    private static final int SCHEMA_VERSION = 1;
    private static final List<Integer> DEFAULT_THRESHOLDS = List.of(80, 100);

    private final Map<String, AlertThresholdConfig> perCustomerConfig = new ConcurrentHashMap<>();
    private final long dedupTtlMinutes;
    private DurableStateStore durableStateStore = NoopDurableStateStore.INSTANCE;

    public ThresholdConfigService(@Value("${alerts.dedup.ttl-minutes:360}") long dedupTtlMinutes) {
        this.dedupTtlMinutes = dedupTtlMinutes;
    }

    @Autowired(required = false)
    public void setDurableStateStore(DurableStateStore durableStateStore) {
        this.durableStateStore = durableStateStore;
        loadState();
    }

    public AlertThresholdConfig getConfig(String customerId) {
        AlertThresholdConfig existing = perCustomerConfig.get(customerId);
        if (existing != null) {
            return existing;
        }

        AlertThresholdConfig created = defaultConfig(customerId);
        perCustomerConfig.put(customerId, created);
        persistState();
        return created;
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
        persistState();
        return updated;
    }

    private AlertThresholdConfig defaultConfig(String customerId) {
        return new AlertThresholdConfig(customerId, DEFAULT_THRESHOLDS, dedupTtlMinutes, Instant.now(), "system");
    }

    private void loadState() {
        ThresholdConfigState state = durableStateStore.read(
            STATE_KEY,
            new TypeReference<>() {
            },
            ThresholdConfigState::empty
        );
        perCustomerConfig.clear();
        perCustomerConfig.putAll(state.configByCustomer());
    }

    private void persistState() {
        durableStateStore.write(STATE_KEY, new ThresholdConfigState(SCHEMA_VERSION, Map.copyOf(perCustomerConfig)));
    }

    private record ThresholdConfigState(int schemaVersion, Map<String, AlertThresholdConfig> configByCustomer) {
        private static ThresholdConfigState empty() {
            return new ThresholdConfigState(SCHEMA_VERSION, Map.of());
        }
    }
}
