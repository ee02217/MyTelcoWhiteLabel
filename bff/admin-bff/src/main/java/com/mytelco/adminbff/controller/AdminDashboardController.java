package com.mytelco.adminbff.controller;

import com.mytelco.adminbff.model.AdminDashboardResponse;
import com.mytelco.adminbff.service.AdminAggregationService;
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
 * REST controller for admin-facing dashboard endpoints.
 * Provides aggregated data for the admin management portal.
 */
@RestController
@RequestMapping(\"/api/v1/admin\")
@Tag(name = \"Admin Dashboard\", description = \"Admin dashboard aggregation endpoints\")
public class AdminDashboardController {

    private final AdminAggregationService aggregationService;

    public AdminDashboardController(AdminAggregationService aggregationService) {
        this.aggregationService = aggregationService;
    }

    /**
     * Aggregated dashboard endpoint for admin overview.
     * Returns combined tenant, offer, and operations data in a single response.
     * 
     * Performance target: p95 < 400ms
     */
    @GetMapping(\"/dashboard\")
    @Operation(
        summary = \"Get Admin Dashboard\",
        description = \"Retrieves aggregated admin dashboard data including tenant, offer, and operations summaries\"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = \"200\", description = \"Dashboard data retrieved successfully\"),
        @ApiResponse(responseCode = \"400\", description = \"Invalid tenant ID\"),
        @ApiResponse(responseCode = \"404\", description = \"Tenant not found\")
    })
    public ResponseEntity<AdminDashboardResponse> getDashboard() {
        // Using a default tenant ID for demo purposes
        AdminDashboardResponse response = aggregationService.getDashboard(\"default\");
        return ResponseEntity.ok(response);
    }

    /**
     * Get dashboard for specific tenant.
     */
    @GetMapping(\"/{tenantId}/dashboard\")
    @Operation(
        summary = \"Get Admin Dashboard by Tenant ID\",
        description = \"Retrieves aggregated dashboard data for a specific tenant\"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = \"200\", description = \"Dashboard data retrieved successfully\"),
        @ApiResponse(responseCode = \"400\", description = \"Invalid tenant ID\"),
        @ApiResponse(responseCode = \"404\", description = \"Tenant not found\")
    })
    public ResponseEntity<AdminDashboardResponse> getDashboardByTenantId(
            @Parameter(description = \"Tenant ID\", required = true)
            @PathVariable String tenantId) {
        AdminDashboardResponse response = aggregationService.getDashboard(tenantId);
        return ResponseEntity.ok(response);
    }
}
