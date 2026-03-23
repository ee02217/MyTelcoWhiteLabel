package com.mytelco.customerbff.controller;

import com.mytelco.customerbff.analytics.ProductAnalyticsService;
import com.mytelco.customerbff.model.SupportCaseCreateRequest;
import com.mytelco.customerbff.model.SupportCaseMessageRequest;
import com.mytelco.customerbff.model.SupportCaseResponse;
import com.mytelco.customerbff.operator.OperatorContextResolver;
import com.mytelco.customerbff.security.CustomerIdentityResolver;
import com.mytelco.customerbff.service.SupportCaseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/customer/support/cases")
@Tag(name = "Support Cases", description = "Customer support case creation and timeline tracking")
public class SupportCaseController {

    private final SupportCaseService supportCaseService;
    private final CustomerIdentityResolver customerIdentityResolver;
    private final OperatorContextResolver operatorContextResolver;
    private final ProductAnalyticsService productAnalyticsService;

    public SupportCaseController(
        SupportCaseService supportCaseService,
        CustomerIdentityResolver customerIdentityResolver,
        OperatorContextResolver operatorContextResolver,
        ProductAnalyticsService productAnalyticsService
    ) {
        this.supportCaseService = supportCaseService;
        this.customerIdentityResolver = customerIdentityResolver;
        this.operatorContextResolver = operatorContextResolver;
        this.productAnalyticsService = productAnalyticsService;
    }

    @PostMapping
    @Operation(summary = "Create support case")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "Case created")})
    public ResponseEntity<SupportCaseResponse> create(
        Authentication authentication,
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestHeader(value = "X-Operator-ID", required = false) String operatorId,
        @RequestHeader(value = "X-Channel", required = false) String channel,
        @RequestHeader(value = "X-Correlation-ID", required = false) String correlationId,
        @Valid @RequestBody SupportCaseCreateRequest request
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        String resolvedOperatorId = resolveOperatorId(customerId, operatorId);
        String resolvedChannel = resolveChannel(channel);

        SupportCaseResponse response = supportCaseService.create(authorization, request);

        productAnalyticsService.trackSupportCaseCreated(
            customerId,
            resolvedOperatorId,
            resolvedChannel,
            correlationId,
            response.caseId(),
            response.category(),
            response.priority()
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping
    @Operation(summary = "List support cases")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "Cases listed")})
    public ResponseEntity<List<SupportCaseResponse>> list(
        @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        return ResponseEntity.ok(supportCaseService.list(authorization));
    }

    @GetMapping("/{caseId}")
    @Operation(summary = "Get support case by id")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "Case found")})
    public ResponseEntity<SupportCaseResponse> get(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable String caseId
    ) {
        SupportCaseResponse supportCase = supportCaseService.get(authorization, caseId);
        if (supportCase == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(supportCase);
    }

    @PostMapping("/{caseId}/messages")
    @Operation(summary = "Append message to support case timeline")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "Timeline updated")})
    public ResponseEntity<SupportCaseResponse> addMessage(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable String caseId,
        @Valid @RequestBody SupportCaseMessageRequest request
    ) {
        SupportCaseResponse supportCase = supportCaseService.addMessage(authorization, caseId, request);
        if (supportCase == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(supportCase);
    }

    private String resolveOperatorId(String customerId, String operatorId) {
        if (operatorId != null && !operatorId.isBlank()) {
            return operatorId.trim();
        }
        return operatorContextResolver.resolveOperatorId(customerId);
    }

    private String resolveChannel(String channel) {
        if (channel == null || channel.isBlank()) {
            return "web";
        }
        return channel.trim().toLowerCase();
    }
}
