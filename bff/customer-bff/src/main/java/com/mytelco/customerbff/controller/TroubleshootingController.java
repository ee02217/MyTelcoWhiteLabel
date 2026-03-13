package com.mytelco.customerbff.controller;

import com.mytelco.customerbff.model.TroubleshootingFlow;
import com.mytelco.customerbff.model.TroubleshootingResolveRequest;
import com.mytelco.customerbff.model.TroubleshootingSessionResponse;
import com.mytelco.customerbff.model.TroubleshootingSessionStartRequest;
import com.mytelco.customerbff.model.TroubleshootingSessionStepRequest;
import com.mytelco.customerbff.service.TroubleshootingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/customer/troubleshooting")
public class TroubleshootingController {

    private final TroubleshootingService troubleshootingService;

    public TroubleshootingController(TroubleshootingService troubleshootingService) {
        this.troubleshootingService = troubleshootingService;
    }

    @GetMapping("/flows")
    public ResponseEntity<List<TroubleshootingFlow>> flows() {
        return ResponseEntity.ok(troubleshootingService.listFlows());
    }

    @PostMapping("/session/start")
    public ResponseEntity<TroubleshootingSessionResponse> startSession(
        @Valid @RequestBody TroubleshootingSessionStartRequest request
    ) {
        try {
            return ResponseEntity.ok(troubleshootingService.startSession(request));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/session/{sessionId}/step")
    public ResponseEntity<TroubleshootingSessionResponse> addStep(
        @PathVariable String sessionId,
        @Valid @RequestBody TroubleshootingSessionStepRequest request
    ) {
        try {
            return ResponseEntity.ok(troubleshootingService.addStep(sessionId, request));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/session/{sessionId}/resolve")
    public ResponseEntity<TroubleshootingSessionResponse> resolve(
        @PathVariable String sessionId,
        @Valid @RequestBody TroubleshootingResolveRequest request
    ) {
        try {
            return ResponseEntity.ok(troubleshootingService.resolve(sessionId, request));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }
}
