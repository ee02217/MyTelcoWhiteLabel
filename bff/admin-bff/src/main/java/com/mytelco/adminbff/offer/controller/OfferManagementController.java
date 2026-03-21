package com.mytelco.adminbff.offer.controller;

import com.mytelco.adminbff.offer.model.OfferDetailResponse;
import com.mytelco.adminbff.offer.model.OfferSummaryResponse;
import com.mytelco.adminbff.offer.model.OfferUpdateRequest;
import com.mytelco.adminbff.offer.model.OfferVersionResponse;
import com.mytelco.adminbff.offer.service.OfferManagementService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/operators/{operatorId}/offers")
public class OfferManagementController {

    private final OfferManagementService offerManagementService;

    public OfferManagementController(OfferManagementService offerManagementService) {
        this.offerManagementService = offerManagementService;
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public List<OfferSummaryResponse> listOffers(@PathVariable String operatorId) {
        return offerManagementService.listOffers(operatorId);
    }

    @GetMapping(value = "/{offerId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public OfferDetailResponse getOffer(
        @PathVariable String operatorId,
        @PathVariable String offerId,
        @RequestParam(value = "version", required = false) Integer version
    ) {
        return offerManagementService.getOffer(operatorId, offerId, version);
    }

    @PatchMapping(value = "/{offerId}", consumes = MediaType.APPLICATION_JSON_VALUE,
        produces = MediaType.APPLICATION_JSON_VALUE)
    public OfferVersionResponse updateOffer(
        @PathVariable String operatorId,
        @PathVariable String offerId,
        @RequestBody OfferUpdateRequest request,
        Principal principal
    ) {
        String actor = principal != null ? principal.getName() : "system";
        return offerManagementService.updateOffer(operatorId, offerId, request, actor);
    }
}
