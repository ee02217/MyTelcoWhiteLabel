package com.mytelco.customerbff.family;

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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/customer/family/roles")
@Tag(name = "Family Roles", description = "Line-level family roles and permissions")
public class FamilyRolesController {

    private final FamilyRoleService familyRoleService;
    private final CustomerIdentityResolver customerIdentityResolver;

    public FamilyRolesController(
        FamilyRoleService familyRoleService,
        CustomerIdentityResolver customerIdentityResolver
    ) {
        this.familyRoleService = familyRoleService;
        this.customerIdentityResolver = customerIdentityResolver;
    }

    @GetMapping
    @Operation(summary = "Get family line role assignments")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "Assignments retrieved")})
    public ResponseEntity<FamilyRolesResponse> getRoles(
        Authentication authentication,
        @RequestHeader(value = "X-Family-Acting-Line-ID", required = false) String actingLineId
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        return ResponseEntity.ok(familyRoleService.getRoles(customerId, actingLineId));
    }

    @PatchMapping("/{lineId}")
    @Operation(summary = "Update role for a family line")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Role updated"),
        @ApiResponse(responseCode = "403", description = "Insufficient permission")
    })
    public ResponseEntity<FamilyRoleEntry> updateRole(
        Authentication authentication,
        @PathVariable String lineId,
        @RequestHeader(value = "X-Family-Acting-Line-ID", required = false) String actingLineId,
        @RequestHeader(value = "X-Correlation-ID", required = false) String correlationId,
        @RequestBody FamilyRoleUpdateRequest request
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        return ResponseEntity.ok(
            familyRoleService.updateRole(customerId, actingLineId, lineId, request, correlationId)
        );
    }

    @GetMapping("/audit")
    @Operation(summary = "Get role change audit entries")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "Audit entries retrieved")})
    public ResponseEntity<List<FamilyRoleAuditEntry>> audit(
        Authentication authentication,
        @RequestParam(value = "limit", required = false) Integer limit
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        return ResponseEntity.ok(familyRoleService.audit(customerId, limit));
    }
}
