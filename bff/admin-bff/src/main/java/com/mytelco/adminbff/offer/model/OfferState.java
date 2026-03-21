package com.mytelco.adminbff.offer.model;

import com.fasterxml.jackson.annotation.JsonCreator;

import java.util.Locale;

public enum OfferState {
    DRAFT,
    APPROVAL,
    PUBLISHED,
    RETIRED;

    @JsonCreator
    public static OfferState from(String value) {
        if (value == null) {
            return null;
        }
        try {
            return OfferState.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }
}
