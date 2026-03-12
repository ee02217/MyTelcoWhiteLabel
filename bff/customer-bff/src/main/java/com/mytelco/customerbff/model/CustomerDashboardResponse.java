package com.mytelco.customerbff.model;

import java.time.Instant;

/**
 * Aggregated customer dashboard response combining account, usage, and billing data.
 */
public record CustomerDashboardResponse(
    AccountSummary accountSummary,
    UsageSummary usageSummary,
    BillingSummary billingSummary,
    Instant responseTime
) {}
