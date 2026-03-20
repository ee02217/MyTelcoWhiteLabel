package com.mytelco.adminbff.content.model;

import com.fasterxml.jackson.annotation.JsonCreator;

import java.util.Locale;

public enum ContentState {
    DRAFT,
    REVIEW,
    PUBLISHED;

    @JsonCreator
    public static ContentState from(String value) {
        if (value == null) {
            return null;
        }
        try {
            return ContentState.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }
}
