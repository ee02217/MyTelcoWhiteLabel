package com.mytelco.casebff.model;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record TroubleTicketResponse(
    UUID id,
    String externalId,
    String category,
    String title,
    String description,
    String priority,
    String status,
    String customerId,
    String affectedServiceId,
    Instant slaTarget,
    Instant expectedResponseAt,
    Instant resolvedAt,
    Instant createdAt,
    Instant updatedAt,
    List<TroubleTicketEventResponse> timeline
) {}
