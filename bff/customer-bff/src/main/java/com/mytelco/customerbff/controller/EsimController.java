package com.mytelco.customerbff.controller;

import com.mytelco.customerbff.family.FamilyPermission;
import com.mytelco.customerbff.family.FamilyRoleService;
import com.mytelco.customerbff.model.EsimActivationResponse;
import com.mytelco.customerbff.security.CustomerIdentityResolver;
import com.mytelco.customerbff.service.EsimService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/customer/esim")
public class EsimController {

    private final EsimService esimService;
    private final CustomerIdentityResolver customerIdentityResolver;
    private final FamilyRoleService familyRoleService;

    public EsimController(
        EsimService esimService,
        CustomerIdentityResolver customerIdentityResolver,
        FamilyRoleService familyRoleService
    ) {
        this.esimService = esimService;
        this.customerIdentityResolver = customerIdentityResolver;
        this.familyRoleService = familyRoleService;
    }

    @PostMapping("/{lineId}/activate")
    public ResponseEntity<EsimActivationResponse> activate(
        Authentication authentication,
        @PathVariable String lineId,
        @RequestHeader(value = "X-Family-Acting-Line-ID", required = false) String actingLineId
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        familyRoleService.requirePermission(customerId, actingLineId, lineId, FamilyPermission.MANAGE_ESIM);

        return ResponseEntity.ok(esimService.activate(lineId));
    }

    @GetMapping("/{lineId}/status")
    public ResponseEntity<EsimActivationResponse> status(
        Authentication authentication,
        @PathVariable String lineId,
        @RequestHeader(value = "X-Family-Acting-Line-ID", required = false) String actingLineId
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        familyRoleService.requirePermission(customerId, actingLineId, lineId, FamilyPermission.VIEW_USAGE);

        try {
            return ResponseEntity.ok(esimService.getStatus(lineId));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.notFound().build();
        }
    }
}
