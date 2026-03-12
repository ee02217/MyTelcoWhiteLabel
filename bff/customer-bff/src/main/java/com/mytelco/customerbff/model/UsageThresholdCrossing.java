package com.mytelco.customerbff.model;

import java.time.Instant;

public record UsageThresholdCrossing(
    String lineId,
    String service,
    int thresholdPercent,
    double currentPercent,
    Instant crossedAt
) {}
