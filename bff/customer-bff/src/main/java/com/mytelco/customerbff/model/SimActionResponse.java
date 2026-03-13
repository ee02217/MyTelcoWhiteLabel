package com.mytelco.customerbff.model;

import java.time.Instant;

public record SimActionResponse(
    String lineId,
    SimStatus previousStatus,
    SimStatus currentStatus,
    Instant changedAt,
    String message
) {}
