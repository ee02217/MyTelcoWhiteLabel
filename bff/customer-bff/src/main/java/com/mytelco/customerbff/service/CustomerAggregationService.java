package com.mytelco.customerbff.service;

import com.mytelco.customerbff.events.DomainEventPublisher;
import com.mytelco.customerbff.events.EventTopic;
import com.mytelco.customerbff.events.NoopDomainEventPublisher;
import com.mytelco.customerbff.mock.MockCustomerDataProvider;
import com.mytelco.customerbff.model.*;
import com.mytelco.customerbff.provider.AccountProvider;
import com.mytelco.customerbff.provider.BillingProvider;
import com.mytelco.customerbff.provider.UsageProvider;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;

/**
 * Service that aggregates data from multiple providers for the customer dashboard.
 * Includes performance instrumentation for p95 response time tracking.
 * 
 * When mock profile is active, uses MockCustomerDataProvider instead of real providers.
 */
@Service
public class CustomerAggregationService {

    private final AccountProvider accountProvider;
    private final UsageProvider usageProvider;
    private final BillingProvider billingProvider;
    private final UsageThresholdAlertService usageThresholdAlertService;
    private final MockCustomerDataProvider mockDataProvider;
    private final boolean isMockMode;
    private final Timer dashboardTimer;
    private final Timer accountOverviewTimer;
    private final Timer usageDetailsTimer;
    private DomainEventPublisher domainEventPublisher = NoopDomainEventPublisher.INSTANCE;

    public CustomerAggregationService(
            AccountProvider accountProvider,
            UsageProvider usageProvider,
            BillingProvider billingProvider,
            UsageThresholdAlertService usageThresholdAlertService,
            MeterRegistry meterRegistry,
            @Autowired(required = false) MockCustomerDataProvider mockDataProvider) {
        this.accountProvider = accountProvider;
        this.usageProvider = usageProvider;
        this.billingProvider = billingProvider;
        this.usageThresholdAlertService = usageThresholdAlertService;
        this.mockDataProvider = mockDataProvider;
        this.isMockMode = mockDataProvider != null;

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

    @Autowired(required = false)
    public void setDomainEventPublisher(DomainEventPublisher domainEventPublisher) {
        this.domainEventPublisher = domainEventPublisher;
    }

    /**
     * Aggregates all customer dashboard data from multiple providers.
     * Performance: p95 target < 400ms
     */
    public CustomerDashboardResponse getDashboard(String customerId) {
        return dashboardTimer.record(() -> {
            AccountSummary accountSummary;
            UsageSummary usageSummary;
            BillingSummary billingSummary;

            if (isMockMode) {
                accountSummary = mockDataProvider.getAccountSummary(customerId);
                usageSummary = mockDataProvider.getUsageSummary(customerId);
                billingSummary = mockDataProvider.getBillingSummary(customerId);
            } else {
                accountSummary = accountProvider.getAccountSummary(customerId);
                usageSummary = usageProvider.getUsageSummary(customerId);
                billingSummary = billingProvider.getBillingSummary(customerId);
            }

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
        return accountOverviewTimer.record(() -> {
            if (isMockMode) {
                return mockDataProvider.getAccountOverview(customerId);
            }
            return accountProvider.getAccountOverview(customerId);
        });
    }

    public CustomerUsageResponse getUsageDetails(String customerId, UsageView view, String lineId) {
        return usageDetailsTimer.record(() -> {
            CustomerUsageResponse usage;
            if (isMockMode) {
                usage = mockDataProvider.getUsageDetails(customerId, view, lineId);
            } else {
                usage = usageProvider.getUsageDetails(customerId, view, lineId);
            }
            
            var crossings = usageThresholdAlertService.evaluateAndDispatch(customerId, usage);
            CustomerUsageResponse response = new CustomerUsageResponse(
                usage.view(),
                usage.periodStart(),
                usage.periodEnd(),
                usage.customerId(),
                usage.totals(),
                usage.lines(),
                crossings,
                usage.dataFreshness()
            );

            domainEventPublisher.publish(
                EventTopic.USAGE,
                "usage.details.requested.v1",
                customerId,
                usage.view(),
                Map.of(
                    "view", usage.view(),
                    "lineId", lineId == null ? "ALL" : lineId,
                    "lineCount", usage.lines().size(),
                    "crossings", crossings.size()
                )
            );

            return response;
        });
    }
}
