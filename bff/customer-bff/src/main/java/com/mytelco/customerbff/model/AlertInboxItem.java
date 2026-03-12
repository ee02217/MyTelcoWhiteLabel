package com.mytelco.customerbff.model;

import java.time.Instant;

public record AlertInboxItem(
    String id,
    String customerId,
    String lineId,
    String service,
    int thresholdPercent,
    double currentPercent,
    String channel,
    String actor,
    String message,
    Instant createdAt
) {}
