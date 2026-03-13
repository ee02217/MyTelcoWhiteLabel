package com.mytelco.customerbff.controller;

import com.mytelco.customerbff.model.RoamingPack;
import com.mytelco.customerbff.model.RoamingPackPurchaseRequest;
import com.mytelco.customerbff.model.RoamingPackPurchaseResponse;
import com.mytelco.customerbff.service.RoamingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/customer/roaming/packs")
public class RoamingController {

    private final RoamingService roamingService;

    public RoamingController(RoamingService roamingService) {
        this.roamingService = roamingService;
    }

    @GetMapping
    public ResponseEntity<List<RoamingPack>> list(@RequestParam String country, @RequestParam String lineId) {
        return ResponseEntity.ok(roamingService.listPacks(country, lineId));
    }

    @PostMapping("/purchase")
    public ResponseEntity<RoamingPackPurchaseResponse> purchase(@Valid @RequestBody RoamingPackPurchaseRequest request) {
        try {
            return ResponseEntity.ok(roamingService.purchase(request));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }
}
