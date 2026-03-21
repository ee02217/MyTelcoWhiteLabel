package com.mytelco.customerbff.experiment;

import com.mytelco.customerbff.security.CustomerIdentityResolver;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/customer/experiments")
public class ExperimentController {

    private final ExperimentService experimentService;
    private final CustomerIdentityResolver customerIdentityResolver;

    public ExperimentController(ExperimentService experimentService, CustomerIdentityResolver customerIdentityResolver) {
        this.experimentService = experimentService;
        this.customerIdentityResolver = customerIdentityResolver;
    }

    @GetMapping
    public ResponseEntity<List<Experiment>> getActiveExperiments(Authentication authentication) {
        return ResponseEntity.ok(experimentService.getActiveExperiments());
    }

    @GetMapping("/all")
    public ResponseEntity<List<Experiment>> getAllExperiments() {
        return ResponseEntity.ok(experimentService.getAllExperiments());
    }

    @GetMapping("/{experimentId}")
    public ResponseEntity<Experiment> getExperiment(@PathVariable String experimentId) {
        Experiment experiment = experimentService.getExperiment(experimentId);
        return experiment != null ? ResponseEntity.ok(experiment) : ResponseEntity.notFound().build();
    }

    @GetMapping("/assignment")
    public ResponseEntity<List<ExperimentAssignment>> getAssignments(Authentication authentication) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        return ResponseEntity.ok(experimentService.getAssignments(customerId));
    }

    @GetMapping("/{experimentId}/assignment")
    public ResponseEntity<ExperimentAssignment> getAssignment(
        Authentication authentication,
        @PathVariable String experimentId
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        ExperimentAssignment assignment = experimentService.assignVariant(customerId, experimentId);
        return assignment != null ? ResponseEntity.ok(assignment) : ResponseEntity.notFound().build();
    }

    @PostMapping("/{experimentId}/exposure")
    public ResponseEntity<Void> recordExposure(
        Authentication authentication,
        @PathVariable String experimentId,
        @RequestParam String variant
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        experimentService.recordExposure(customerId, experimentId, variant);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/feature/{featureFlag}")
    public ResponseEntity<Map<String, Boolean>> isFeatureEnabled(
        Authentication authentication,
        @PathVariable String featureFlag
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        boolean enabled = experimentService.isFeatureEnabled(customerId, featureFlag);
        return ResponseEntity.ok(Map.of("enabled", enabled));
    }
}
