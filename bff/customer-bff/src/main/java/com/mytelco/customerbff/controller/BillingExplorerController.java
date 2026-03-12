package com.mytelco.customerbff.controller;

import com.mytelco.customerbff.model.BillExplorerResponse;
import com.mytelco.customerbff.service.BillingExplorerService;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.YearMonth;

@RestController
@RequestMapping("/api/v1/customer/billing")
@Tag(name = "Customer Billing", description = "Bill explorer and invoice download endpoints")
public class BillingExplorerController {

    private final BillingExplorerService billingExplorerService;
    private final MeterRegistry meterRegistry;

    public BillingExplorerController(BillingExplorerService billingExplorerService, MeterRegistry meterRegistry) {
        this.billingExplorerService = billingExplorerService;
        this.meterRegistry = meterRegistry;
    }

    @GetMapping("/explorer")
    @Operation(
        summary = "Get bill explorer for period",
        description = "Returns grouped bill line items, totals, current vs previous comparison and invoice metadata"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Bill explorer retrieved successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid period format")
    })
    public ResponseEntity<BillExplorerResponse> getBillExplorer(
        @Parameter(description = "Billing period in format YYYY-MM", example = "2026-03")
        @RequestParam String period
    ) {
        Timer timer = Timer.builder("customer.billing.explorer.endpoint")
            .description("Endpoint time for customer bill explorer")
            .publishPercentiles(0.50, 0.95, 0.99)
            .register(meterRegistry);

        BillExplorerResponse response = timer.record(
            () -> billingExplorerService.getBillExplorer("12345", YearMonth.parse(period))
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/invoice/{invoiceId}/download")
    @Operation(summary = "Download invoice PDF")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Invoice download stream"),
        @ApiResponse(responseCode = "404", description = "Invoice not found")
    })
    public ResponseEntity<Resource> downloadInvoice(@PathVariable String invoiceId) {
        Resource pdf = billingExplorerService.getInvoicePdf(invoiceId);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + invoiceId + ".pdf\"")
            .body(pdf);
    }
}
