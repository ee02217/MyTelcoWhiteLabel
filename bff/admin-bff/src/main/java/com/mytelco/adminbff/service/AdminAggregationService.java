package com.mytelco.adminbff.service;

import com.mytelco.adminbff.model.*;
import com.mytelco.adminbff.provider.OfferProvider;
import com.mytelco.adminbff.provider.OpsProvider;
import com.mytelco.adminbff.provider.TenantProvider;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Service;

import java.time.Instant;

/**
 * Service that aggregates data from multiple providers for the admin dashboard.
 * Includes performance instrumentation for p95 response time tracking.
 */
@Service
public class AdminAggregationService {

    private final TenantProvider tenantProvider;
    private final OfferProvider offerProvider;
    private final OpsProvider opsProvider;
    private final Timer dashboardTimer;

    public AdminAggregationService(
            TenantProvider tenantProvider,
            OfferProvider offerProvider,
            OpsProvider opsProvider,
            MeterRegistry meterRegistry) {
        this.tenantProvider = tenantProvider;
        this.offerProvider = offerProvider;
        this.opsProvider = opsProvider;
        
        // Timer for tracking dashboard aggregation performance
        this.dashboardTimer = Timer.builder("admin.dashboard.aggregation")
            .description("Time taken to aggregate admin dashboard data")
            .publishPercentiles(0.50, 0.95, 0.99)
            .register(meterRegistry);
    }

    /**
     * Aggregates all admin dashboard data from multiple providers.
     * Performance: p95 target < 400ms
     */
    public AdminDashboardResponse getDashboard(String tenantId) {
        return dashboardTimer.record(() -> {
            TenantSummary tenantSummary = tenantProvider.getTenantSummary(tenantId);
            OfferSummary offerSummary = offerProvider.getOfferSummary();
            OpsSummary opsSummary = opsProvider.getOpsSummary();

            return new AdminDashboardResponse(
                tenantSummary,
                offerSummary,
                opsSummary,
                Instant.now()
            );
        });
    }
}
