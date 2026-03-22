package com.mytelco.adminbff.offer.model;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record OfferSummaryResponse(
    String offerId,
    int version,
    OfferState state,
    String name,
    List<String> visibleChannels,
    Map<String, Object> eligibilityRules,
    String author,
    String reviewer,
    Instant updatedAt
) {
}
