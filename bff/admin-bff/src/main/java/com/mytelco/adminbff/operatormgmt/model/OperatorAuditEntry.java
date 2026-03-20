package com.mytelco.adminbff.operatormgmt.model;

import java.time.Instant;
import java.util.Map;

public record OperatorAuditEntry(
    String operatorId,
    String scope,
    String targetId,
    String action,
    String actor,
    long version,
    Instant timestamp,
    Map<String, Object> changes
) {
}
