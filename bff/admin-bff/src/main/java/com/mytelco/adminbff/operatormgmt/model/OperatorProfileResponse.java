package com.mytelco.adminbff.operatormgmt.model;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record OperatorProfileResponse(
    String operatorId,
    String name,
    OperatorBranding branding,
    Map<String, Map<String, Boolean>> featuresByChannel,
    List<String> locales,
    int journeyCount,
    long version,
    Instant updatedAt
) {
}
