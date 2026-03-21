package com.mytelco.customerbff.controller;

import com.mytelco.customerbff.analytics.ProductAnalyticsDashboardResponse;
import com.mytelco.customerbff.analytics.ProductAnalyticsService;
import com.mytelco.customerbff.analytics.ProductAnalyticsTaxonomyEntry;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/customer/analytics")
@Tag(name = "Product Analytics", description = "Event taxonomy and funnel dashboard")
public class ProductAnalyticsController {

    private final ProductAnalyticsService productAnalyticsService;

    public ProductAnalyticsController(ProductAnalyticsService productAnalyticsService) {
        this.productAnalyticsService = productAnalyticsService;
    }

    @GetMapping("/taxonomy")
    @Operation(summary = "Get product analytics taxonomy")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "Taxonomy returned")})
    public ResponseEntity<List<ProductAnalyticsTaxonomyEntry>> taxonomy() {
        return ResponseEntity.ok(productAnalyticsService.taxonomy());
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Get product analytics funnel dashboard")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "Dashboard returned")})
    public ResponseEntity<ProductAnalyticsDashboardResponse> dashboard(
        @RequestParam(value = "operatorId", required = false) String operatorId,
        @RequestParam(value = "channel", required = false) String channel,
        @RequestParam(value = "limit", required = false) Integer limit
    ) {
        return ResponseEntity.ok(productAnalyticsService.dashboard(operatorId, channel, limit));
    }
}
