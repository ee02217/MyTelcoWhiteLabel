package com.mytelco.casebff.model;

import java.time.Instant;
import java.util.UUID;

public record TroubleTicketEventResponse(
    UUID id,
    String eventType,
    String actor,
    String actorType,
    String message,
    Instant createdAt
) {}
