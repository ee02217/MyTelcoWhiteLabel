package com.mytelco.adminbff.operatormgmt.model;

import java.time.Instant;

public record OperatorProfileUpdateResponse(
    String operatorId,
    long version,
    String actor,
    Instant updatedAt,
    OperatorProfileResponse profile
) {
}
