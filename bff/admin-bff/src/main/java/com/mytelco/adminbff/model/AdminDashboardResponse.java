package com.mytelco.adminbff.model;

import java.time.Instant;

/**
 * Aggregated admin dashboard response combining tenant, offer, and ops data.
 */
public record AdminDashboardResponse(
    TenantSummary tenantSummary,
    OfferSummary offerSummary,
    OpsSummary opsSummary,
    Instant responseTime
) {}
