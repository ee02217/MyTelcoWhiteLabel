package com.mytelco.customerbff.service.status;

import java.time.Instant;

public record IncidentUpdate(
    String updateId,
    String incidentId,
    String message,
    String status,
    Instant timestamp
) {}
