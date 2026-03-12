package com.mytelco.customerbff.service;

import com.mytelco.customerbff.model.*;
import com.mytelco.customerbff.provider.AccountProvider;
import com.mytelco.customerbff.provider.BillingProvider;
import com.mytelco.customerbff.provider.UsageProvider;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Service;

import java.time.Instant;

/**
 * Service that aggregates data from multiple providers for the customer dashboard.
 * Includes performance instrumentation for p95 response time tracking.
 */
@Service
public class CustomerAggregationService {

    private final AccountProvider accountProvider;
    private final UsageProvider usageProvider;
    private final BillingProvider billingProvider;
    private final UsageThresholdAlertService usageThresholdAlertService;
    private final Timer dashboardTimer;
    private final Timer accountOverviewTimer;
    private final Timer usageDetailsTimer;

    public CustomerAggregationService(
            AccountProvider accountProvider,
            UsageProvider usageProvider,
            BillingProvider billingProvider,
            UsageThresholdAlertService usageThresholdAlertService,
            MeterRegistry meterRegistry) {
        this.accountProvider = accountProvider;
        this.usageProvider = usageProvider;
        this.billingProvider = billingProvider;
        this.usageThresholdAlertService = usageThresholdAlertService;

        // Timer for tracking dashboard aggregation performance
        this.dashboardTimer = Timer.builder("customer.dashboard.aggregation")
            .description("Time taken to aggregate customer dashboard data")
            .publishPercentiles(0.50, 0.95, 0.99)
            .register(meterRegistry);

        this.accountOverviewTimer = Timer.builder("customer.account.overview.aggregation")
            .description("Time taken to aggregate account overview data")
            .publishPercentiles(0.50, 0.95, 0.99)
            .register(meterRegistry);

        this.usageDetailsTimer = Timer.builder("customer.usage.details.aggregation")
            .description("Time taken to aggregate customer usage details")
            .publishPercentiles(0.50, 0.95, 0.99)
            .register(meterRegistry);
    }

    /**
     * Aggregates all customer dashboard data from multiple providers.
     * Performance: p95 target < 400ms
     */
    public CustomerDashboardResponse getDashboard(String customerId) {
        return dashboardTimer.record(() -> {
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

    /**
     * Returns account overview data for account dashboard surfaces.
     */
    public AccountOverviewResponse getAccountOverview(String customerId) {
        return accountOverviewTimer.record(() -> accountProvider.getAccountOverview(customerId));
    }

    public CustomerUsageResponse getUsageDetails(String customerId, UsageView view, String lineId) {
        return usageDetailsTimer.record(() -> {
            CustomerUsageResponse usage = usageProvider.getUsageDetails(customerId, view, lineId);
            var crossings = usageThresholdAlertService.evaluateAndDispatch(customerId, usage);
            return new CustomerUsageResponse(
                usage.view(),
                usage.periodStart(),
                usage.periodEnd(),
                usage.customerId(),
                usage.totals(),
                usage.lines(),
                crossings,
                usage.dataFreshness()
            );
        });
    }
}
