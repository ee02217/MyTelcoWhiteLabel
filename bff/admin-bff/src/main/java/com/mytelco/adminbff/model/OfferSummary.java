package com.mytelco.adminbff.model;

/**
 * Offer summary response model for admin dashboard.
 */
public record OfferSummary(
    int totalOffers,
    int activeOffers,
    int draftOffers,
    int retiredOffers,
    String topPerformingOffer,
    double conversionRate
) {}
