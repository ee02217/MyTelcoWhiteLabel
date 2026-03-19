package com.mytelco.customerbff.controller;

import com.mytelco.customerbff.model.AccountOverviewResponse;
import com.mytelco.customerbff.model.CustomerDashboardResponse;
import com.mytelco.customerbff.model.CustomerUsageResponse;
import com.mytelco.customerbff.model.UsageView;
import com.mytelco.customerbff.security.CustomerIdentityResolver;
import com.mytelco.customerbff.service.CustomerAggregationService;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for customer-facing dashboard endpoints.
 * Provides aggregated data for the customer self-care portal.
 */
@RestController
@RequestMapping("/api/v1/customer")
@Tag(name = "Customer Dashboard", description = "Customer dashboard aggregation endpoints")
public class CustomerDashboardController {

    private final CustomerAggregationService aggregationService;
    private final MeterRegistry meterRegistry;
    private final CustomerIdentityResolver customerIdentityResolver;

    public CustomerDashboardController(
        CustomerAggregationService aggregationService,
        MeterRegistry meterRegistry,
        CustomerIdentityResolver customerIdentityResolver
    ) {
        this.aggregationService = aggregationService;
        this.meterRegistry = meterRegistry;
        this.customerIdentityResolver = customerIdentityResolver;
    }

    /**
     * Aggregated dashboard endpoint for customer account overview.
     * Returns combined account, usage, and billing data in a single response.
     *
     * Performance target: p95 < 400ms
     */
    @GetMapping("/dashboard")
    @Operation(
        summary = "Get Customer Dashboard",
        description = "Retrieves aggregated customer dashboard data including account, usage, and billing summaries"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Dashboard data retrieved successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid customer ID"),
        @ApiResponse(responseCode = "404", description = "Customer not found")
    })
    public ResponseEntity<CustomerDashboardResponse> getDashboard(Authentication authentication) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        CustomerDashboardResponse response = aggregationService.getDashboard(customerId);
        return ResponseEntity.ok(response);
    }

    /**
     * Get dashboard for specific customer.
     */
    @GetMapping("/{customerId}/dashboard")
    @Operation(
        summary = "Get Customer Dashboard by ID",
        description = "Retrieves aggregated dashboard data for a specific customer"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Dashboard data retrieved successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid customer ID"),
        @ApiResponse(responseCode = "404", description = "Customer not found")
    })
    public ResponseEntity<CustomerDashboardResponse> getDashboardByCustomerId(
        Authentication authentication,
        @Parameter(description = "Customer ID", required = true)
        @PathVariable String customerId
    ) {
        customerIdentityResolver.assertSameCustomer(authentication, customerId);
        CustomerDashboardResponse response = aggregationService.getDashboard(customerId);
        return ResponseEntity.ok(response);
    }

    /**
     * Usage details endpoint for F-05.2 usage screen.
     */
    @GetMapping("/usage")
    @Operation(
        summary = "Get customer usage details",
        description = "Returns per-line and per-service usage for daily or billing-cycle views"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Usage details retrieved successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid query parameters"),
        @ApiResponse(responseCode = "404", description = "Customer not found")
    })
    public ResponseEntity<CustomerUsageResponse> getUsageDetails(
        Authentication authentication,
        @RequestParam(defaultValue = "daily") String view,
        @RequestParam(required = false) String lineId
    ) {
        Timer timer = Timer.builder("customer.usage.details.endpoint")
            .description("Endpoint time for customer usage details")
            .publishPercentiles(0.50, 0.95, 0.99)
            .register(meterRegistry);

        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        UsageView usageView = UsageView.fromQuery(view);
        CustomerUsageResponse response = timer.record(
            () -> aggregationService.getUsageDetails(customerId, usageView, lineId)
        );

        return ResponseEntity.ok(response);
    }

    /**
     * Account overview endpoint for F-05.1 account dashboard.
     */
    @GetMapping("/account-overview")
    @Operation(
        summary = "Get account overview",
        description = "Returns plan, active lines, next bill date, outstanding amount and line structure"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Account overview retrieved successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid customer ID"),
        @ApiResponse(responseCode = "404", description = "Customer not found")
    })
    public ResponseEntity<AccountOverviewResponse> getAccountOverview(Authentication authentication) {
        Timer timer = Timer.builder("customer.account.overview.endpoint")
            .description("Endpoint time for customer account overview")
            .publishPercentiles(0.50, 0.95, 0.99)
            .register(meterRegistry);

        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        AccountOverviewResponse response = timer.record(
            () -> aggregationService.getAccountOverview(customerId)
        );

        return ResponseEntity.ok(response);
    }
}
