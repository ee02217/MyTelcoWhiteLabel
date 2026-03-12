package com.mytelco.customerbff.model;

/**
 * Usage summary response model for customer dashboard.
 */
public record UsageSummary(
    long dataUsedMb,
    long dataLimitMb,
    int voiceMinutesUsed,
    int voiceMinutesLimit,
    int smsUsed,
    int smsLimit,
    double dataUsagePercent,
    double voiceUsagePercent,
    double smsUsagePercent
) {}
