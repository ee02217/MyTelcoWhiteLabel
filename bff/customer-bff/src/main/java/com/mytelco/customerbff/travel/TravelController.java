package com.mytelco.customerbff.travel;

import com.mytelco.customerbff.family.FamilyPermission;
import com.mytelco.customerbff.family.FamilyRoleService;
import com.mytelco.customerbff.security.CustomerIdentityResolver;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/customer/travel")
public class TravelController {

    private final TravelRecommendationService recommendationService;
    private final InTripControlService inTripControlService;
    private final CustomerIdentityResolver customerIdentityResolver;
    private final FamilyRoleService familyRoleService;

    public TravelController(
        TravelRecommendationService recommendationService,
        InTripControlService inTripControlService,
        CustomerIdentityResolver customerIdentityResolver,
        FamilyRoleService familyRoleService
    ) {
        this.recommendationService = recommendationService;
        this.inTripControlService = inTripControlService;
        this.customerIdentityResolver = customerIdentityResolver;
        this.familyRoleService = familyRoleService;
    }

    @GetMapping("/recommendations")
    public ResponseEntity<List<TravelRecommendation>> getRecommendations(
        Authentication authentication,
        @RequestParam(required = false) String destination,
        @RequestParam(required = false) String lineId,
        @RequestHeader(value = "X-Family-Acting-Line-ID", required = false) String actingLineId
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        String effectiveLineId = lineId != null ? lineId : (actingLineId != null ? actingLineId : "line-1");

        List<TravelRecommendation> recommendations;
        if (destination != null && !destination.isBlank()) {
            recommendations = recommendationService.getRecommendations(destination, null);
        } else {
            recommendations = recommendationService.getRecommendationsByLine(effectiveLineId);
        }
        return ResponseEntity.ok(recommendations);
    }

    @GetMapping("/usage")
    public ResponseEntity<List<RoamingUsage>> getRoamingUsage(
        Authentication authentication,
        @RequestParam(required = false) String lineId,
        @RequestHeader(value = "X-Family-Acting-Line-ID", required = false) String actingLineId
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        String effectiveLineId = lineId != null ? lineId : (actingLineId != null ? actingLineId : "line-1");

        return ResponseEntity.ok(inTripControlService.getAllUsages(effectiveLineId));
    }

    @GetMapping("/usage/{country}")
    public ResponseEntity<RoamingUsage> getRoamingUsageByCountry(
        Authentication authentication,
        @PathVariable String country,
        @RequestParam(required = false) String lineId,
        @RequestHeader(value = "X-Family-Acting-Line-ID", required = false) String actingLineId
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        String effectiveLineId = lineId != null ? lineId : (actingLineId != null ? actingLineId : "line-1");

        return ResponseEntity.ok(inTripControlService.getUsage(effectiveLineId, country));
    }

    @GetMapping("/spend-cap")
    public ResponseEntity<SpendCap> getSpendCap(
        Authentication authentication,
        @RequestParam(required = false) String lineId,
        @RequestHeader(value = "X-Family-Acting-Line-ID", required = false) String actingLineId
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        String effectiveLineId = lineId != null ? lineId : (actingLineId != null ? actingLineId : "line-1");

        return ResponseEntity.ok(inTripControlService.getSpendCap(effectiveLineId));
    }

    @PutMapping("/spend-cap")
    public ResponseEntity<SpendCap> updateSpendCap(
        Authentication authentication,
        @RequestParam(required = false) String lineId,
        @RequestHeader(value = "X-Family-Acting-Line-ID", required = false) String actingLineId,
        @RequestBody UpdateSpendCapRequest request
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        String effectiveLineId = lineId != null ? lineId : (actingLineId != null ? actingLineId : "line-1");

        familyRoleService.requirePermission(customerId, actingLineId, effectiveLineId, FamilyPermission.MANAGE_PAYMENTS);

        return ResponseEntity.ok(inTripControlService.updateSpendCap(effectiveLineId, request.limit(), request.alertTriggers()));
    }

    @PostMapping("/emergency-topup")
    public ResponseEntity<EmergencyTopupResult> purchaseEmergencyTopup(
        Authentication authentication,
        @RequestParam(required = false) String lineId,
        @RequestHeader(value = "X-Family-Acting-Line-ID", required = false) String actingLineId,
        @RequestBody EmergencyTopupRequest request
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        String effectiveLineId = lineId != null ? lineId : (actingLineId != null ? actingLineId : "line-1");

        familyRoleService.requirePermission(customerId, actingLineId, effectiveLineId, FamilyPermission.MANAGE_PAYMENTS);

        return ResponseEntity.ok(inTripControlService.purchaseEmergencyTopup(effectiveLineId, request.amount()));
    }
}

record UpdateSpendCapRequest(
    BigDecimal limit,
    Set<String> alertTriggers
) {}

record EmergencyTopupRequest(
    BigDecimal amount
) {}
