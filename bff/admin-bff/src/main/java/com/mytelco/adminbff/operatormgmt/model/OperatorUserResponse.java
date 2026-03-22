package com.mytelco.adminbff.operatormgmt.model;

import java.time.Instant;
import java.util.Set;

public record OperatorUserResponse(
    String userId,
    String displayName,
    String email,
    Set<String> roles,
    boolean enabled,
    Instant updatedAt
) {
}
