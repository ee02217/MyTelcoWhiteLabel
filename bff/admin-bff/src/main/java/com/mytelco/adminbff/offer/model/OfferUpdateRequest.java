package com.mytelco.adminbff.offer.model;

import java.util.List;
import java.util.Map;

public record OfferUpdateRequest(
    String name,
    String description,
    Map<String, Object> eligibilityRules,
    List<String> visibleChannels,
    OfferState state,
    String notes,
    String reviewer
) {
}
