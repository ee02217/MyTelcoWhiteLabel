package com.mytelco.adminbff.operatormgmt.model;

import java.time.Instant;
import java.util.List;

public record OperatorSummaryResponse(
    String operatorId,
    String name,
    long version,
    Instant updatedAt,
    List<String> locales,
    int channelCount,
    int journeyCount,
    int userCount
) {
}
