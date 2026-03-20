package com.mytelco.adminbff.content.model;

import java.time.Instant;

public record ContentVersionResponse(
    String contentId,
    String locale,
    int version,
    ContentState state,
    String title,
    String body,
    String notes,
    String author,
    String reviewer,
    Instant updatedAt
) {
}
