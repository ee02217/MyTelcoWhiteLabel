package com.mytelco.adminbff.content.model;

import java.time.Instant;

public record ContentLocaleSummary(
    String locale,
    int version,
    ContentState state,
    Instant updatedAt,
    String author,
    String reviewer
) {
}
