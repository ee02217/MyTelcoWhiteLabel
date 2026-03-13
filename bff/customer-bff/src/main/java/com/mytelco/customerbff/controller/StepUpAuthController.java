package com.mytelco.customerbff.controller;

import com.mytelco.customerbff.model.StepUpChallengeRequest;
import com.mytelco.customerbff.model.StepUpChallengeResponse;
import com.mytelco.customerbff.model.StepUpVerifyRequest;
import com.mytelco.customerbff.model.StepUpVerifyResponse;
import com.mytelco.customerbff.service.StepUpAuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/customer/step-up")
public class StepUpAuthController {

    private final StepUpAuthService service;

    public StepUpAuthController(StepUpAuthService service) {
        this.service = service;
    }

    @PostMapping("/challenges")
    public ResponseEntity<StepUpChallengeResponse> createChallenge(@Valid @RequestBody StepUpChallengeRequest request) {
        return ResponseEntity.ok(service.createChallenge(request));
    }

    @PostMapping("/verify")
    public ResponseEntity<StepUpVerifyResponse> verify(@Valid @RequestBody StepUpVerifyRequest request) {
        try {
            return ResponseEntity.ok(service.verifyChallenge(request));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }
}
