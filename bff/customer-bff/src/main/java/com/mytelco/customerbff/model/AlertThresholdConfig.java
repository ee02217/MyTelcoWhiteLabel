package com.mytelco.customerbff.model;

import java.time.Instant;
import java.util.List;

public record AlertThresholdConfig(
    String customerId,
    List<Integer> thresholds,
    long dedupTtlMinutes,
    Instant updatedAt,
    String updatedBy
) {}
