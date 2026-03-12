package com.mytelco.adminbff.provider;

import com.mytelco.adminbff.model.OpsSummary;
import org.springframework.stereotype.Component;

/**
 * Provider for operations-related data.
 * In production, this would call the monitoring/operations service.
 */
@Component
public class OpsProvider {

    /**
     * Retrieves operations summary for the admin dashboard.
     */
    public OpsSummary getOpsSummary() {
        // Stub implementation
        return new OpsSummary(
            2,
            5,
            99.95,
            150000,
            125.0,
            "HEALTHY"
        );
    }
}
