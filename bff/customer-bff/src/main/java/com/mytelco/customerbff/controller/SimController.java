package com.mytelco.customerbff.controller;

import com.mytelco.customerbff.model.SimActionRequest;
import com.mytelco.customerbff.model.SimActionResponse;
import com.mytelco.customerbff.model.StepUpAction;
import com.mytelco.customerbff.service.SimService;
import com.mytelco.customerbff.service.StepUpAuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/customer/sim")
public class SimController {

    private final SimService simService;
    private final StepUpAuthService stepUpAuthService;

    public SimController(SimService simService, StepUpAuthService stepUpAuthService) {
        this.simService = simService;
        this.stepUpAuthService = stepUpAuthService;
    }

    @PostMapping("/{lineId}/block")
    public ResponseEntity<SimActionResponse> block(@PathVariable String lineId, @Valid @RequestBody SimActionRequest request) {
        if (!stepUpAuthService.isVerificationTokenValid(request.stepUpVerificationToken(), lineId, StepUpAction.SIM_BLOCK)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(simService.block(lineId));
    }

    @PostMapping("/{lineId}/unblock")
    public ResponseEntity<SimActionResponse> unblock(@PathVariable String lineId, @Valid @RequestBody SimActionRequest request) {
        if (!stepUpAuthService.isVerificationTokenValid(request.stepUpVerificationToken(), lineId, StepUpAction.SIM_UNBLOCK)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(simService.unblock(lineId));
    }
}
