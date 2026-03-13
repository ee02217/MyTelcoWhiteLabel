package com.mytelco.customerbff.model;

public record CatalogTermsAcknowledgement(
    boolean accepted,
    String reference,
    String acceptedAt
) {
}
