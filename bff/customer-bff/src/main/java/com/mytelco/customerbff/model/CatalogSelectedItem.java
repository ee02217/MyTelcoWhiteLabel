package com.mytelco.customerbff.model;

public record CatalogSelectedItem(
    String offerId,
    String name,
    CatalogOfferType type,
    CatalogOfferPrice pricing,
    String effectiveDate,
    CatalogOfferTerms terms
) {
}
