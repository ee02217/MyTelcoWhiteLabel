package com.mytelco.customerbff.controller;

import com.mytelco.customerbff.family.FamilyPermission;
import com.mytelco.customerbff.family.FamilyRoleService;
import com.mytelco.customerbff.model.SimActionRequest;
import com.mytelco.customerbff.model.SimActionResponse;
import com.mytelco.customerbff.model.StepUpAction;
import com.mytelco.customerbff.security.CustomerIdentityResolver;
import com.mytelco.customerbff.service.SimService;
import com.mytelco.customerbff.service.StepUpAuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/customer/sim")
public class SimController {

    private final SimService simService;
    private final StepUpAuthService stepUpAuthService;
    private final CustomerIdentityResolver customerIdentityResolver;
    private final FamilyRoleService familyRoleService;

    public SimController(
        SimService simService,
        StepUpAuthService stepUpAuthService,
        CustomerIdentityResolver customerIdentityResolver,
        FamilyRoleService familyRoleService
    ) {
        this.simService = simService;
        this.stepUpAuthService = stepUpAuthService;
        this.customerIdentityResolver = customerIdentityResolver;
        this.familyRoleService = familyRoleService;
    }

    @PostMapping("/{lineId}/block")
    public ResponseEntity<SimActionResponse> block(
        Authentication authentication,
        @PathVariable String lineId,
        @RequestHeader(value = "X-Family-Acting-Line-ID", required = false) String actingLineId,
        @Valid @RequestBody SimActionRequest request
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        familyRoleService.requirePermission(customerId, actingLineId, lineId, FamilyPermission.MANAGE_SIM);

        if (!stepUpAuthService.isVerificationTokenValid(request.stepUpVerificationToken(), lineId, StepUpAction.SIM_BLOCK)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(simService.block(lineId));
    }

    @PostMapping("/{lineId}/unblock")
    public ResponseEntity<SimActionResponse> unblock(
        Authentication authentication,
        @PathVariable String lineId,
        @RequestHeader(value = "X-Family-Acting-Line-ID", required = false) String actingLineId,
        @Valid @RequestBody SimActionRequest request
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        familyRoleService.requirePermission(customerId, actingLineId, lineId, FamilyPermission.MANAGE_SIM);

        if (!stepUpAuthService.isVerificationTokenValid(request.stepUpVerificationToken(), lineId, StepUpAction.SIM_UNBLOCK)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(simService.unblock(lineId));
    }
}
