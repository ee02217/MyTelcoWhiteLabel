package com.mytelco.customerbff.service.status;

import java.time.Instant;

public record Incident(
    String incidentId,
    String title,
    String description,
    ServiceType serviceType,
    String severity,
    String status,
    String regionCode,
    Instant startedAt,
    Instant updatedAt,
    Instant resolvedAt,
    String currentUpdate
) {}
