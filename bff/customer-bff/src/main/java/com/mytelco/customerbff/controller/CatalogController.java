package com.mytelco.customerbff.controller;

import com.mytelco.customerbff.analytics.ProductAnalyticsService;
import com.mytelco.customerbff.family.FamilyPermission;
import com.mytelco.customerbff.family.FamilyRoleService;
import com.mytelco.customerbff.model.CatalogConfirmSelectionRequest;
import com.mytelco.customerbff.model.CatalogConfirmSelectionResponse;
import com.mytelco.customerbff.model.CatalogResponse;
import com.mytelco.customerbff.operator.OperatorContextResolver;
import com.mytelco.customerbff.security.CustomerIdentityResolver;
import com.mytelco.customerbff.service.CatalogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/customer/catalog")
@Tag(name = "Customer Catalog", description = "Plan and add-on catalog endpoints")
public class CatalogController {

    private final CatalogService catalogService;
    private final CustomerIdentityResolver customerIdentityResolver;
    private final OperatorContextResolver operatorContextResolver;
    private final ProductAnalyticsService productAnalyticsService;
    private final FamilyRoleService familyRoleService;

    public CatalogController(
        CatalogService catalogService,
        CustomerIdentityResolver customerIdentityResolver,
        OperatorContextResolver operatorContextResolver,
        ProductAnalyticsService productAnalyticsService,
        FamilyRoleService familyRoleService
    ) {
        this.catalogService = catalogService;
        this.customerIdentityResolver = customerIdentityResolver;
        this.operatorContextResolver = operatorContextResolver;
        this.productAnalyticsService = productAnalyticsService;
        this.familyRoleService = familyRoleService;
    }

    @GetMapping
    @Operation(summary = "Get plan/add-on catalog")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Catalog retrieved"),
        @ApiResponse(responseCode = "400", description = "Invalid query parameters")
    })
    public ResponseEntity<CatalogResponse> getCatalog(
        Authentication authentication,
        @RequestParam String lineId,
        @RequestParam String operatorId,
        @RequestParam(required = false) String type,
        @RequestHeader(value = "X-Family-Acting-Line-ID", required = false) String actingLineId
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        familyRoleService.requirePermission(
            customerId,
            actingLineId,
            lineId,
            FamilyPermission.VIEW_USAGE
        );

        return ResponseEntity.ok(catalogService.getCatalog(lineId, operatorId, type));
    }

    @PostMapping("/confirm-selection")
    @Operation(summary = "Confirm selected catalog items")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Selection confirmed"),
        @ApiResponse(responseCode = "400", description = "Invalid request")
    })
    public ResponseEntity<CatalogConfirmSelectionResponse> confirmSelection(
        Authentication authentication,
        @RequestHeader(value = "X-Operator-ID", required = false) String operatorId,
        @RequestHeader(value = "X-Channel", required = false) String channel,
        @RequestHeader(value = "X-Correlation-ID", required = false) String correlationId,
        @RequestHeader(value = "X-Family-Acting-Line-ID", required = false) String actingLineId,
        @Valid @RequestBody CatalogConfirmSelectionRequest request
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        String resolvedOperatorId = resolveOperatorId(customerId, operatorId);
        String resolvedChannel = resolveChannel(channel);

        familyRoleService.requirePermission(
            customerId,
            actingLineId,
            request.lineId(),
            FamilyPermission.MANAGE_PLAN
        );

        CatalogConfirmSelectionResponse response = catalogService.confirmSelection(request);

        productAnalyticsService.trackPlanChangeConfirmed(
            customerId,
            resolvedOperatorId,
            resolvedChannel,
            correlationId,
            request.lineId(),
            request.selectedOfferIds().size(),
            request.termsAccepted()
        );

        return ResponseEntity.ok(response);
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
