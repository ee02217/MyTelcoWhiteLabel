package com.mytelco.customerbff.family;

import java.time.Instant;

public record FamilyRoleAuditEntry(
    String auditId,
    String lineId,
    FamilyRole previousRole,
    FamilyRole newRole,
    String actorCustomerId,
    String actorLineId,
    Instant changedAt,
    String note
) {
}
