package com.mytelco.customerbff.service;

import com.mytelco.customerbff.model.*;
import com.mytelco.customerbff.provider.AccountProvider;
import com.mytelco.customerbff.provider.BillingProvider;
import com.mytelco.customerbff.provider.UsageProvider;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.concurrent.TimeUnit;

/**
 * Service that aggregates data from multiple providers for the customer dashboard.
 * Includes performance instrumentation for p95 response time tracking.
 */
@Service
public class CustomerAggregationService {

    private final AccountProvider accountProvider;
    private final UsageProvider usageProvider;
    private final BillingProvider billingProvider;
    private final Timer dashboardTimer;

    public CustomerAggregationService(
            AccountProvider accountProvider,
            UsageProvider usageProvider,
            BillingProvider billingProvider,
            MeterRegistry meterRegistry) {
        this.accountProvider = accountProvider;
        this.usageProvider = usageProvider;
        this.billingProvider = billingProvider;
        
        // Timer for tracking dashboard aggregation performance
        this.dashboardTimer = Timer.builder("customer.dashboard.aggregation")
            .description("Time taken to aggregate customer dashboard data")
            .publishPercentiles(0.50, 0.95, 0.99)
            .register(meterRegistry);
    }

    /**
     * Aggregates all customer dashboard data from multiple providers.
     * Performance: p95 target < 400ms
     */
    public CustomerDashboardResponse getDashboard(String customerId) {
        return dashboardTimer.record(() -> {
            // Fetch all data in parallel (simulated - actual implementation would use CompletableFuture)
            AccountSummary accountSummary = accountProvider.getAccountSummary(customerId);
            UsageSummary usageSummary = usageProvider.getUsageSummary(customerId);
            BillingSummary billingSummary = billingProvider.getBillingSummary(customerId);

            return new CustomerDashboardResponse(
                accountSummary,
                usageSummary,
                billingSummary,
                Instant.now()
            );
        });
    }
}
