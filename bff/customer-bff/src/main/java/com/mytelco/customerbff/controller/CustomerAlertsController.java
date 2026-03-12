package com.mytelco.customerbff.controller;

import com.mytelco.customerbff.model.AlertInboxItem;
import com.mytelco.customerbff.model.AlertThresholdConfig;
import com.mytelco.customerbff.model.AlertThresholdConfigUpdateRequest;
import com.mytelco.customerbff.service.AlertInboxService;
import com.mytelco.customerbff.service.ThresholdConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/customer/alerts")
@Tag(name = "Customer Alerts", description = "Threshold configuration and alerts inbox")
public class CustomerAlertsController {

    private final ThresholdConfigService thresholdConfigService;
    private final AlertInboxService alertInboxService;

    public CustomerAlertsController(ThresholdConfigService thresholdConfigService, AlertInboxService alertInboxService) {
        this.thresholdConfigService = thresholdConfigService;
        this.alertInboxService = alertInboxService;
    }

    @GetMapping("/thresholds")
    @Operation(summary = "Get alert thresholds", description = "Returns threshold configuration for current customer")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Threshold config returned")
    })
    public ResponseEntity<AlertThresholdConfig> getThresholds() {
        return ResponseEntity.ok(thresholdConfigService.getConfig("12345"));
    }

    @PutMapping("/thresholds")
    @Operation(summary = "Update alert thresholds", description = "Updates threshold configuration for current customer")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Threshold config updated")
    })
    public ResponseEntity<AlertThresholdConfig> updateThresholds(@Valid @RequestBody AlertThresholdConfigUpdateRequest request) {
        return ResponseEntity.ok(thresholdConfigService.updateConfig("12345", request.thresholds(), "customer"));
    }

    @GetMapping("/inbox")
    @Operation(summary = "List in-app alerts inbox", description = "Returns generated threshold alert notifications")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Inbox returned")
    })
    public ResponseEntity<List<AlertInboxItem>> getInbox() {
        return ResponseEntity.ok(alertInboxService.list("12345"));
    }
}
