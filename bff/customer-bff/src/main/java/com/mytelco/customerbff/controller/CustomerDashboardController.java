package com.mytelco.customerbff.controller;

import com.mytelco.customerbff.model.CustomerDashboardResponse;
import com.mytelco.customerbff.service.CustomerAggregationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
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

    public CustomerDashboardController(CustomerAggregationService aggregationService) {
        this.aggregationService = aggregationService;
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
    public ResponseEntity<CustomerDashboardResponse> getDashboard() {
        // Using a default customer ID for demo purposes
        // In production, this would be extracted from authentication context
        CustomerDashboardResponse response = aggregationService.getDashboard("12345");
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
            @Parameter(description = "Customer ID", required = true)
            @PathVariable String customerId) {
        CustomerDashboardResponse response = aggregationService.getDashboard(customerId);
        return ResponseEntity.ok(response);
    }
}
