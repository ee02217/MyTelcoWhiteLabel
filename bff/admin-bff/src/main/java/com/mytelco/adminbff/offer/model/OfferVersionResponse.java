package com.mytelco.adminbff.offer.model;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record OfferVersionResponse(
    String offerId,
    int version,
    OfferState state,
    String name,
    String description,
    Map<String, Object> eligibilityRules,
    List<String> visibleChannels,
    String notes,
    String author,
    String reviewer,
    Instant updatedAt
) {
}
