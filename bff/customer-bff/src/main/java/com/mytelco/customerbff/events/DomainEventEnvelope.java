package com.mytelco.customerbff.events;

import java.time.Instant;
import java.util.Map;

public record DomainEventEnvelope(
    String eventId,
    String topic,
    String eventType,
    int schemaVersion,
    String customerId,
    String correlationId,
    Instant occurredAt,
    Map<String, Object> payload,
    Map<String, String> metadata
) {
}
