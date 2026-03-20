package com.mytelco.adminbff.content.model;

public record ContentUpdateRequest(
    String locale,
    String title,
    String body,
    String notes,
    ContentState state,
    String reviewer
) {
}
