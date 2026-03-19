package com.mytelco.customerbff.events;

import com.fasterxml.jackson.core.type.TypeReference;
import com.mytelco.customerbff.service.persistence.DurableStateStore;
import com.mytelco.customerbff.service.persistence.NoopDurableStateStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class DomainEventBackboneService implements DomainEventPublisher {

    private static final String STATE_KEY = "event-backbone-state";
    private static final int SCHEMA_VERSION = 1;

    private final EventBackboneProperties properties;
    private final EventSchemaVersionPolicy schemaVersionPolicy;
    private final DomainEventDispatcher eventDispatcher;

    private final Map<String, DomainEventEnvelope> deliveredByEventId = new ConcurrentHashMap<>();
    private final Map<String, DeadLetterEvent> deadLetterByEventId = new ConcurrentHashMap<>();

    private DurableStateStore durableStateStore = NoopDurableStateStore.INSTANCE;

    public DomainEventBackboneService(
        EventBackboneProperties properties,
        EventSchemaVersionPolicy schemaVersionPolicy,
        DomainEventDispatcher eventDispatcher
    ) {
        this.properties = properties;
        this.schemaVersionPolicy = schemaVersionPolicy;
        this.eventDispatcher = eventDispatcher;
    }

    @Autowired(required = false)
    public void setDurableStateStore(DurableStateStore durableStateStore) {
        this.durableStateStore = durableStateStore;
        loadState();
    }

    @Override
    public void publish(
        EventTopic topic,
        String eventType,
        String customerId,
        String correlationId,
        Map<String, Object> payload
    ) {
        if (!properties.isEnabled()) {
            return;
        }

        DomainEventEnvelope envelope = new DomainEventEnvelope(
            UUID.randomUUID().toString(),
            topic.topicName(),
            eventType,
            schemaVersionPolicy.versionForEventType(eventType),
            customerId,
            correlationId,
            Instant.now(),
            payload == null ? Map.of() : payload,
            Map.of(
                "topicGroup", topic.name(),
                "schemaPolicy", "mytelco.events.schema"
            )
        );

        dispatchWithRetry(envelope);
    }

    public List<DomainEventEnvelope> listOutbox(EventTopic topic, int limit) {
        return deliveredByEventId.values().stream()
            .filter(event -> topic == null || event.topic().equalsIgnoreCase(topic.topicName()))
            .sorted(Comparator.comparing(DomainEventEnvelope::occurredAt).reversed())
            .limit(normalizeLimit(limit))
            .toList();
    }

    public List<DeadLetterEvent> listDeadLetter(EventTopic topic, int limit) {
        return deadLetterByEventId.values().stream()
            .filter(event -> topic == null || event.event().topic().equalsIgnoreCase(topic.topicName()))
            .sorted(Comparator.comparing(DeadLetterEvent::failedAt).reversed())
            .limit(normalizeLimit(limit))
            .toList();
    }

    public ReplayResult replay(String eventId) {
        DeadLetterEvent deadLetterEvent = deadLetterByEventId.get(eventId);
        if (deadLetterEvent == null) {
            return new ReplayResult(eventId, false, "DLQ_EVENT_NOT_FOUND");
        }

        try {
            eventDispatcher.dispatch(deadLetterEvent.event());
            deadLetterByEventId.remove(eventId);
            deliveredByEventId.put(eventId, deadLetterEvent.event());
            trimDeliveredHistory();
            persistState();
            return new ReplayResult(eventId, true, null);
        } catch (Exception exception) {
            DeadLetterEvent updated = new DeadLetterEvent(
                deadLetterEvent.eventId(),
                deadLetterEvent.event(),
                deadLetterEvent.attempts() + 1,
                deadLetterEvent.replayCount() + 1,
                "DISPATCH_RETRY_FAILED",
                exception.getMessage(),
                deadLetterEvent.failedAt(),
                Instant.now()
            );
            deadLetterByEventId.put(eventId, updated);
            persistState();
            return new ReplayResult(eventId, false, exception.getMessage());
        }
    }

    public BulkReplayResult replay(EventTopic topic, int limit) {
        List<DeadLetterEvent> candidates = listDeadLetter(topic, limit);
        int success = 0;
        int failed = 0;

        for (DeadLetterEvent candidate : candidates) {
            ReplayResult replayResult = replay(candidate.eventId());
            if (replayResult.replayed()) {
                success += 1;
            } else {
                failed += 1;
            }
        }

        return new BulkReplayResult(candidates.size(), success, failed);
    }

    public Set<String> topics() {
        Set<String> topics = new LinkedHashSet<>();
        EnumSet.allOf(EventTopic.class).forEach(topic -> topics.add(topic.topicName()));
        return topics;
    }

    public Map<String, Integer> schemaPolicy() {
        return schemaVersionPolicy.effectivePolicy();
    }

    private void dispatchWithRetry(DomainEventEnvelope envelope) {
        int maxAttempts = Math.max(1, properties.getRetry().getMaxAttempts());
        Duration backoff = normalizeDuration(properties.getRetry().getInitialBackoff(), Duration.ofMillis(1));
        Duration maxBackoff = normalizeDuration(properties.getRetry().getMaxBackoff(), Duration.ofSeconds(1));
        double multiplier = Math.max(1.0, properties.getRetry().getMultiplier());

        Exception lastFailure = null;

        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                eventDispatcher.dispatch(envelope);
                deliveredByEventId.put(envelope.eventId(), envelope);
                deadLetterByEventId.remove(envelope.eventId());
                trimDeliveredHistory();
                persistState();
                return;
            } catch (Exception exception) {
                lastFailure = exception;
                if (attempt >= maxAttempts) {
                    deadLetterByEventId.put(
                        envelope.eventId(),
                        new DeadLetterEvent(
                            envelope.eventId(),
                            envelope,
                            attempt,
                            0,
                            "DISPATCH_FAILED",
                            exception.getMessage(),
                            Instant.now(),
                            Instant.now()
                        )
                    );
                    persistState();
                    return;
                }
                sleep(backoff);
                long nextMillis = Math.round(backoff.toMillis() * multiplier);
                backoff = Duration.ofMillis(Math.min(maxBackoff.toMillis(), Math.max(1L, nextMillis)));
            }
        }

        if (lastFailure != null) {
            deadLetterByEventId.put(
                envelope.eventId(),
                new DeadLetterEvent(
                    envelope.eventId(),
                    envelope,
                    maxAttempts,
                    0,
                    "DISPATCH_FAILED",
                    lastFailure.getMessage(),
                    Instant.now(),
                    Instant.now()
                )
            );
            persistState();
        }
    }

    private int normalizeLimit(int limit) {
        if (limit <= 0) {
            return 50;
        }
        return Math.min(limit, 500);
    }

    private Duration normalizeDuration(Duration value, Duration fallback) {
        if (value == null || value.isNegative() || value.isZero()) {
            return fallback;
        }
        return value;
    }

    private void sleep(Duration backoff) {
        try {
            Thread.sleep(backoff.toMillis());
        } catch (InterruptedException interruptedException) {
            Thread.currentThread().interrupt();
        }
    }

    private void trimDeliveredHistory() {
        int maxEntries = Math.max(100, properties.getMaxDeliveredEvents());
        if (deliveredByEventId.size() <= maxEntries) {
            return;
        }

        List<DomainEventEnvelope> ordered = deliveredByEventId.values().stream()
            .sorted(Comparator.comparing(DomainEventEnvelope::occurredAt).reversed())
            .toList();

        Map<String, DomainEventEnvelope> bounded = new LinkedHashMap<>();
        for (int i = 0; i < Math.min(maxEntries, ordered.size()); i++) {
            DomainEventEnvelope envelope = ordered.get(i);
            bounded.put(envelope.eventId(), envelope);
        }

        deliveredByEventId.clear();
        deliveredByEventId.putAll(bounded);
    }

    private void loadState() {
        EventBackboneState state = durableStateStore.read(
            STATE_KEY,
            new TypeReference<>() {
            },
            EventBackboneState::empty
        );

        deliveredByEventId.clear();
        deliveredByEventId.putAll(state.deliveredByEventId());

        deadLetterByEventId.clear();
        deadLetterByEventId.putAll(state.deadLetterByEventId());
    }

    private void persistState() {
        durableStateStore.write(
            STATE_KEY,
            new EventBackboneState(
                SCHEMA_VERSION,
                Map.copyOf(deliveredByEventId),
                Map.copyOf(deadLetterByEventId)
            )
        );
    }

    private record EventBackboneState(
        int schemaVersion,
        Map<String, DomainEventEnvelope> deliveredByEventId,
        Map<String, DeadLetterEvent> deadLetterByEventId
    ) {
        private static EventBackboneState empty() {
            return new EventBackboneState(SCHEMA_VERSION, Map.of(), Map.of());
        }
    }

    public record ReplayResult(String eventId, boolean replayed, String error) {
    }

    public record BulkReplayResult(int attempted, int replayed, int failed) {
    }
}
