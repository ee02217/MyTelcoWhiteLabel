package com.mytelco.customerbff.controller;

import com.mytelco.customerbff.family.FamilyPermission;
import com.mytelco.customerbff.family.FamilyRoleService;
import com.mytelco.customerbff.model.RoamingPack;
import com.mytelco.customerbff.model.RoamingPackPurchaseRequest;
import com.mytelco.customerbff.model.RoamingPackPurchaseResponse;
import com.mytelco.customerbff.security.CustomerIdentityResolver;
import com.mytelco.customerbff.service.RoamingService;
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

import java.util.List;

@RestController
@RequestMapping("/api/v1/customer/roaming/packs")
public class RoamingController {

    private final RoamingService roamingService;
    private final CustomerIdentityResolver customerIdentityResolver;
    private final FamilyRoleService familyRoleService;

    public RoamingController(
        RoamingService roamingService,
        CustomerIdentityResolver customerIdentityResolver,
        FamilyRoleService familyRoleService
    ) {
        this.roamingService = roamingService;
        this.customerIdentityResolver = customerIdentityResolver;
        this.familyRoleService = familyRoleService;
    }

    @GetMapping
    public ResponseEntity<List<RoamingPack>> list(
        Authentication authentication,
        @RequestParam String country,
        @RequestParam String lineId,
        @RequestHeader(value = "X-Family-Acting-Line-ID", required = false) String actingLineId
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        familyRoleService.requirePermission(customerId, actingLineId, lineId, FamilyPermission.VIEW_USAGE);

        return ResponseEntity.ok(roamingService.listPacks(country, lineId));
    }

    @PostMapping("/purchase")
    public ResponseEntity<RoamingPackPurchaseResponse> purchase(
        Authentication authentication,
        @RequestHeader(value = "X-Family-Acting-Line-ID", required = false) String actingLineId,
        @Valid @RequestBody RoamingPackPurchaseRequest request
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        familyRoleService.requirePermission(customerId, actingLineId, request.lineId(), FamilyPermission.MANAGE_ROAMING);

        try {
            return ResponseEntity.ok(roamingService.purchase(request));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }
}
