package com.mytelco.adminbff.configflags.model;

import java.time.Instant;

public record AuditEntry(
    String operatorId,
    String channel,
    String flagKey,
    boolean oldValue,
    boolean newValue,
    String actor,
    Instant timestamp,
    long version
) {
}
