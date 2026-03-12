package com.mytelco.adminbff.provider;

import com.mytelco.adminbff.model.TenantSummary;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Provider for tenant-related data.
 * In production, this would call the tenant management service.
 */
@Component
public class TenantProvider {

    /**
     * Retrieves tenant summary for the admin dashboard.
     */
    public TenantSummary getTenantSummary(String tenantId) {
        // Stub implementation
        return new TenantSummary(
            "TENANT-" + tenantId,
            "Demo Operator",
            15000,
            12500,
            "ACTIVE",
            LocalDateTime.now().minusYears(1)
        );
    }
}
