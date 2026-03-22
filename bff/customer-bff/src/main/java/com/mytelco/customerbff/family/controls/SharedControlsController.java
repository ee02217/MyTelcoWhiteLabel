package com.mytelco.customerbff.family.controls;

import com.mytelco.customerbff.security.CustomerIdentityResolver;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/customer/family/controls")
@Tag(name = "Family Shared Controls", description = "Family usage/spending caps with overrides")
public class SharedControlsController {

    private final SharedControlService sharedControlService;
    private final CustomerIdentityResolver customerIdentityResolver;

    public SharedControlsController(
        SharedControlService sharedControlService,
        CustomerIdentityResolver customerIdentityResolver
    ) {
        this.sharedControlService = sharedControlService;
        this.customerIdentityResolver = customerIdentityResolver;
    }

    @GetMapping
    @Operation(summary = "Get family shared controls")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "Controls returned")})
    public ResponseEntity<SharedControlsResponse> controls(
        Authentication authentication,
        @RequestHeader(value = "X-Family-Acting-Line-ID", required = false) String actingLineId
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        return ResponseEntity.ok(sharedControlService.getSharedControls(customerId, actingLineId));
    }

    @PatchMapping("/{lineId}/caps")
    @Operation(summary = "Update cap for one category on one line")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Cap updated"),
        @ApiResponse(responseCode = "403", description = "Permission denied")
    })
    public ResponseEntity<SharedControlCap> updateCap(
        Authentication authentication,
        @PathVariable String lineId,
        @RequestHeader(value = "X-Family-Acting-Line-ID", required = false) String actingLineId,
        @RequestHeader(value = "X-Correlation-ID", required = false) String correlationId,
        @RequestBody SharedControlCapUpdateRequest request
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        return ResponseEntity.ok(sharedControlService.updateCap(customerId, actingLineId, lineId, request, correlationId));
    }

    @PostMapping("/override-requests")
    @Operation(summary = "Create an override request")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "Override request created")})
    public ResponseEntity<SharedControlOverrideRequest> requestOverride(
        Authentication authentication,
        @RequestHeader(value = "X-Family-Acting-Line-ID", required = false) String actingLineId,
        @RequestHeader(value = "X-Correlation-ID", required = false) String correlationId,
        @RequestBody SharedControlOverrideCreateRequest request
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        return ResponseEntity.ok(sharedControlService.createOverrideRequest(customerId, actingLineId, request, correlationId));
    }

    @PostMapping("/override-requests/{requestId}/decision")
    @Operation(summary = "Approve or reject an override request")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Override resolved"),
        @ApiResponse(responseCode = "403", description = "Permission denied")
    })
    public ResponseEntity<SharedControlOverrideRequest> decideOverride(
        Authentication authentication,
        @PathVariable String requestId,
        @RequestHeader(value = "X-Family-Acting-Line-ID", required = false) String actingLineId,
        @RequestHeader(value = "X-Correlation-ID", required = false) String correlationId,
        @RequestBody SharedControlOverrideDecisionRequest request
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        return ResponseEntity.ok(sharedControlService.decideOverride(customerId, actingLineId, requestId, request, correlationId));
    }
}
