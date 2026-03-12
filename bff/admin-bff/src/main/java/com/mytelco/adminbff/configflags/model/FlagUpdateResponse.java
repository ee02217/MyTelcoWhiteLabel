package com.mytelco.adminbff.configflags.model;

import java.time.Instant;

public record FlagUpdateResponse(
    String operatorId,
    String channel,
    String flagKey,
    boolean enabled,
    long version,
    String actor,
    Instant updatedAt
) {
}
