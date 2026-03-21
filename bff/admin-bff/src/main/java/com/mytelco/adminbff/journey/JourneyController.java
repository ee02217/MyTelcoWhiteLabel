package com.mytelco.adminbff.journey;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/v1/admin/journeys")
public class JourneyController {

    private final Map<String, Map<String, Object>> journeys = new HashMap<>();

    public JourneyController() {
        // Mock journeys/flows
        Map<String, Object> onboarding = new HashMap<>();
        onboarding.put("id", "journey-1");
        onboarding.put("name", "New User Onboarding");
        onboarding.put("description", "Welcome flow for new subscribers");
        onboarding.put("status", "ACTIVE");
        onboarding.put("trigger", "USER_CREATED");
        onboarding.put("steps", List.of(
            Map.of("id", "step-1", "type", "WELCOME_EMAIL", "order", 1),
            Map.of("id", "step-2", "type", "SMS_VERIFICATION", "order", 2),
            Map.of("id", "step-3", "type", "PLAN_SELECTION", "order", 3),
            Map.of("id", "step-4", "type", "PAYMENT_SETUP", "order", 4)
        ));
        onboarding.put("stats", Map.of("triggered", 1250, "completed", 1100, "abandoned", 150));
        journeys.put("journey-1", onboarding);

        Map<String, Object> churn = new HashMap<>();
        churn.put("id", "journey-2");
        churn.put("name", "Churn Prevention");
        churn.put("description", "Retain at-risk customers");
        churn.put("status", "ACTIVE");
        churn.put("trigger", "LOW_USAGE_DETECTED");
        churn.put("steps", List.of(
            Map.of("id", "step-1", "type", "ANALYTICS_ALERT", "order", 1),
            Map.of("id", "step-2", "type", "OFFER_PRESENTATION", "order", 2),
            Map.of("id", "step-3", "type", "WAIT_48H", "order", 3),
            Map.of("id", "step-4", "type", "RETENTION_OFFER", "order", 4)
        ));
        churn.put("stats", Map.of("triggered", 340, "saved", 180, "lost", 160));
        journeys.put("journey-2", churn);

        Map<String, Object> upgrade = new HashMap<>();
        upgrade.put("id", "journey-3");
        upgrade.put("name", "Plan Upgrade Flow");
        upgrade.put("description", "Upsell to higher tier plans");
        upgrade.put("status", "DRAFT");
        upgrade.put("trigger", "USAGE_THRESHOLD");
        upgrade.put("steps", List.of(
            Map.of("id", "step-1", "type", "USAGE_INSIGHT", "order", 1),
            Map.of("id", "step-2", "type", "PLAN_COMPARISON", "order", 2),
            Map.of("id", "step-3", "type", "CHECKOUT", "order", 3)
        ));
        upgrade.put("stats", Map.of("triggered", 0, "completed", 0, "abandoned", 0));
        journeys.put("journey-3", upgrade);
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listJourneys(
            @RequestParam(required = false) String status) {
        List<Map<String, Object>> result = new ArrayList<>(journeys.values());
        
        if (status != null) {
            result = result.stream()
                .filter(j -> j.get("status").equals(status))
                .toList();
        }
        
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getJourney(@PathVariable String id) {
        Map<String, Object> journey = journeys.get(id);
        return journey != null ? ResponseEntity.ok(journey) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createJourney(@RequestBody CreateJourneyRequest request) {
        String id = "journey-" + System.currentTimeMillis();
        Map<String, Object> journey = new HashMap<>();
        journey.put("id", id);
        journey.put("name", request.name());
        journey.put("description", request.description());
        journey.put("status", "DRAFT");
        journey.put("trigger", request.trigger());
        journey.put("steps", List.of());
        journey.put("stats", Map.of("triggered", 0, "completed", 0, "abandoned", 0));
        
        journeys.put(id, journey);
        return ResponseEntity.ok(journey);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateJourney(
            @PathVariable String id,
            @RequestBody UpdateJourneyRequest request) {
        
        Map<String, Object> journey = journeys.get(id);
        if (journey == null) return ResponseEntity.notFound().build();
        
        if (request.name() != null) journey.put("name", request.name());
        if (request.description() != null) journey.put("description", request.description());
        if (request.status() != null) journey.put("status", request.status());
        if (request.trigger() != null) journey.put("trigger", request.trigger());
        
        return ResponseEntity.ok(journey);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteJourney(@PathVariable String id) {
        Map<String, Object> removed = journeys.remove(id);
        return removed != null 
            ? ResponseEntity.ok(Map.of("deleted", true))
            : ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<Map<String, Object>> publishJourney(@PathVariable String id) {
        Map<String, Object> journey = journeys.get(id);
        if (journey == null) return ResponseEntity.notFound().build();
        
        journey.put("status", "ACTIVE");
        journey.put("publishedAt", Instant.now().toString());
        
        return ResponseEntity.ok(journey);
    }

    @PostMapping("/{id}/steps")
    public ResponseEntity<Map<String, Object>> addStep(
            @PathVariable String id,
            @RequestBody AddStepRequest request) {
        
        Map<String, Object> journey = journeys.get(id);
        if (journey == null) return ResponseEntity.notFound().build();
        
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> steps = new ArrayList<>((List<Map<String, Object>>) journey.get("steps"));
        
        Map<String, Object> newStep = new HashMap<>();
        newStep.put("id", "step-" + System.currentTimeMillis());
        newStep.put("type", request.type());
        newStep.put("order", steps.size() + 1);
        if (request.config() != null) newStep.put("config", request.config());
        
        steps.add(newStep);
        journey.put("steps", steps);
        
        return ResponseEntity.ok(journey);
    }
}

record CreateJourneyRequest(String name, String description, String trigger) {}
record UpdateJourneyRequest(String name, String description, String status, String trigger) {}
record AddStepRequest(String type, Map<String, Object> config) {}
