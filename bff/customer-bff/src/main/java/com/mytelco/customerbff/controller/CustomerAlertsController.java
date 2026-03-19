package com.mytelco.customerbff.controller;

import com.mytelco.customerbff.model.AlertInboxItem;
import com.mytelco.customerbff.model.AlertThresholdConfig;
import com.mytelco.customerbff.model.AlertThresholdConfigUpdateRequest;
import com.mytelco.customerbff.security.CustomerIdentityResolver;
import com.mytelco.customerbff.service.AlertInboxService;
import com.mytelco.customerbff.service.ThresholdConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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
    private final CustomerIdentityResolver customerIdentityResolver;

    public CustomerAlertsController(
        ThresholdConfigService thresholdConfigService,
        AlertInboxService alertInboxService,
        CustomerIdentityResolver customerIdentityResolver
    ) {
        this.thresholdConfigService = thresholdConfigService;
        this.alertInboxService = alertInboxService;
        this.customerIdentityResolver = customerIdentityResolver;
    }

    @GetMapping("/thresholds")
    @Operation(summary = "Get alert thresholds", description = "Returns threshold configuration for current customer")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Threshold config returned")
    })
    public ResponseEntity<AlertThresholdConfig> getThresholds(Authentication authentication) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        return ResponseEntity.ok(thresholdConfigService.getConfig(customerId));
    }

    @PutMapping("/thresholds")
    @Operation(summary = "Update alert thresholds", description = "Updates threshold configuration for current customer")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Threshold config updated")
    })
    public ResponseEntity<AlertThresholdConfig> updateThresholds(
        Authentication authentication,
        @Valid @RequestBody AlertThresholdConfigUpdateRequest request
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        return ResponseEntity.ok(thresholdConfigService.updateConfig(customerId, request.thresholds(), customerId));
    }

    @GetMapping("/inbox")
    @Operation(summary = "List in-app alerts inbox", description = "Returns generated threshold alert notifications")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Inbox returned")
    })
    public ResponseEntity<List<AlertInboxItem>> getInbox(Authentication authentication) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        return ResponseEntity.ok(alertInboxService.list(customerId));
    }
}
