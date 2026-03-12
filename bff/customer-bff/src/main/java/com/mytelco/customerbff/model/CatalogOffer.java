package com.mytelco.customerbff.model;

public record CatalogOffer(
    String offerId,
    String name,
    CatalogOfferType type,
    boolean eligible,
    String eligibilityReason,
    CatalogOfferPrice pricing,
    String effectiveDate,
    CatalogOfferTerms terms
) {
}
