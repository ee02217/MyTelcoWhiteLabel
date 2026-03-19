package com.mytelco.customerbff.events;

import java.time.Instant;

public record DeadLetterEvent(
    String eventId,
    DomainEventEnvelope event,
    int attempts,
    int replayCount,
    String errorCode,
    String errorMessage,
    Instant failedAt,
    Instant lastAttemptAt
) {
}
