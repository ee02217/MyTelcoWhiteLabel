package com.mytelco.customerbff.controller;

import com.mytelco.customerbff.family.FamilyPermission;
import com.mytelco.customerbff.family.FamilyRoleService;
import com.mytelco.customerbff.family.controls.SharedControlCategory;
import com.mytelco.customerbff.family.controls.SharedControlService;
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
    private final SharedControlService sharedControlService;

    public RoamingController(
        RoamingService roamingService,
        CustomerIdentityResolver customerIdentityResolver,
        FamilyRoleService familyRoleService,
        SharedControlService sharedControlService
    ) {
        this.roamingService = roamingService;
        this.customerIdentityResolver = customerIdentityResolver;
        this.familyRoleService = familyRoleService;
        this.sharedControlService = sharedControlService;
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

        sharedControlService.assertWithinCap(
            customerId,
            actingLineId,
            request.lineId(),
            SharedControlCategory.ADDON_PURCHASES,
            1d,
            "Roaming pack purchase",
            null
        );

        try {
            RoamingPackPurchaseResponse response = roamingService.purchase(request);
            sharedControlService.recordUsage(
                customerId,
                request.lineId(),
                SharedControlCategory.ADDON_PURCHASES,
                1d,
                null,
                "roaming.purchase"
            );
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }
}
