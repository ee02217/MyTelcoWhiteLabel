package com.mytelco.customerbff.controller;

import com.mytelco.customerbff.model.EsimActivationResponse;
import com.mytelco.customerbff.service.EsimService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/customer/esim")
public class EsimController {

    private final EsimService esimService;

    public EsimController(EsimService esimService) {
        this.esimService = esimService;
    }

    @PostMapping("/{lineId}/activate")
    public ResponseEntity<EsimActivationResponse> activate(@PathVariable String lineId) {
        return ResponseEntity.ok(esimService.activate(lineId));
    }

    @GetMapping("/{lineId}/status")
    public ResponseEntity<EsimActivationResponse> status(@PathVariable String lineId) {
        try {
            return ResponseEntity.ok(esimService.getStatus(lineId));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.notFound().build();
        }
    }
}
