package com.mytelco.customerbff.family.controls;

import java.time.Instant;

public record SharedControlOverrideRequest(
    String requestId,
    String lineId,
    SharedControlCategory category,
    double requestedAmount,
    String reason,
    SharedControlOverrideStatus status,
    String requestedByCustomerId,
    String requestedByLineId,
    Instant createdAt,
    String decidedByCustomerId,
    String decidedByLineId,
    Instant decidedAt,
    String decisionNote
) {
}
