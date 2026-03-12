package com.mytelco.adminbff.model;

import java.time.LocalDateTime;

/**
 * Tenant summary response model for admin dashboard.
 */
public record TenantSummary(
    String tenantId,
    String tenantName,
    int totalCustomers,
    int activeCustomers,
    String status,
    LocalDateTime createdAt
) {}
