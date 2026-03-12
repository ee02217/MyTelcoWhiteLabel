package com.mytelco.adminbff.model;

/**
 * Operations summary response model for admin dashboard.
 */
public record OpsSummary(
    int activeIncidents,
    int resolvedToday,
    double systemUptime,
    int apiCallsToday,
    double avgResponseTimeMs,
    String healthStatus
) {}
