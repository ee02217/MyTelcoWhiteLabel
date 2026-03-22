package com.mytelco.customerbff.experiment;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
public class ExperimentService {

    private final Map<String, Experiment> experiments = new HashMap<>();
    private final Map<String, List<ExperimentAssignment>> assignments = new HashMap<>();

    public ExperimentService() {
        // Register default experiments
        registerExperiment(new Experiment(
            "exp-home-layout-v1",
            "Home Dashboard Layout",
            "Test new dashboard layout vs legacy",
            "RUNNING",
            List.of("control", "variant_a", "variant_b"),
            Map.of("control", 33.0, "variant_a", 33.0, "variant_b", 34.0),
            Map.of(
                "control", Map.of("showUsageCard", true, "showDevicesCard", true, "bannerPosition", "top"),
                "variant_a", Map.of("showUsageCard", true, "showDevicesCard", false, "bannerPosition", "middle"),
                "variant_b", Map.of("showUsageCard", false, "showDevicesCard", true, "bannerPosition", "bottom")
            ),
            "2026-01-01",
            "2026-12-31"
        ));

        registerExperiment(new Experiment(
            "exp-checkout-flow-v1",
            "Checkout Flow Optimization",
            "Simplified vs multi-step checkout",
            "RUNNING",
            List.of("control", "simplified"),
            Map.of("control", 50.0, "simplified", 50.0),
            Map.of(
                "control", Map.of("steps", 4, "showSummary", true),
                "simplified", Map.of("steps", 2, "showSummary", false)
            ),
            "2026-01-15",
            "2026-06-30"
        ));

        registerExperiment(new Experiment(
            "exp-roaming-packs-v1",
            "Roaming Pack Presentation",
            "List vs card grid presentation",
            "RUNNING",
            List.of("control", "grid"),
            Map.of("control", 50.0, "grid", 50.0),
            Map.of(
                "control", Map.of("displayMode", "list", "showSavings", true),
                "grid", Map.of("displayMode", "grid", "showSavings", false)
            ),
            "2026-02-01",
            "2026-07-31"
        ));
    }

    public void registerExperiment(Experiment experiment) {
        experiments.put(experiment.experimentId(), experiment);
    }

    public List<Experiment> getActiveExperiments() {
        return experiments.values().stream()
            .filter(e -> "RUNNING".equals(e.status()))
            .toList();
    }

    public Experiment getExperiment(String experimentId) {
        return experiments.get(experimentId);
    }

    public List<Experiment> getAllExperiments() {
        return new ArrayList<>(experiments.values());
    }

    public ExperimentAssignment assignVariant(String customerId, String experimentId) {
        Experiment experiment = experiments.get(experimentId);
        if (experiment == null || !"RUNNING".equals(experiment.status())) {
            return null;
        }

        // Consistent assignment based on customer ID hash
        int hash = Math.abs(customerId.hashCode() + experimentId.hashCode());
        double roll = (hash % 1000) / 10.0;

        double cumulative = 0;
        String assignedVariant = "control";
        for (String variant : experiment.variants()) {
            cumulative += experiment.trafficAllocation().getOrDefault(variant, 0.0);
            if (roll < cumulative) {
                assignedVariant = variant;
                break;
            }
        }

        ExperimentAssignment assignment = new ExperimentAssignment(
            experimentId,
            assignedVariant,
            experiment.config().get(assignedVariant),
            Instant.now().toEpochMilli()
        );

        assignments.computeIfAbsent(customerId, k -> new ArrayList<>()).add(assignment);
        return assignment;
    }

    public List<ExperimentAssignment> getAssignments(String customerId) {
        return assignments.getOrDefault(customerId, Collections.emptyList());
    }

    public Map<String, Object> getVariantConfig(String customerId, String experimentId) {
        ExperimentAssignment assignment = assignments.getOrDefault(customerId, Collections.emptyList())
            .stream()
            .filter(a -> a.experimentId().equals(experimentId))
            .findFirst()
            .orElse(null);

        if (assignment == null) {
            assignment = assignVariant(customerId, experimentId);
        }

        return assignment != null ? assignment.config() : Collections.emptyMap();
    }

    public void recordExposure(String customerId, String experimentId, String variant) {
        // In production, this would track to analytics
        System.out.println("Exposure recorded: customer=" + customerId + ", experiment=" + experimentId + ", variant=" + variant);
    }

    public boolean isFeatureEnabled(String customerId, String featureFlag) {
        // Simple feature flag check - in production this would be more sophisticated
        return switch (featureFlag) {
            case "new_dashboard" -> getVariantConfig(customerId, "exp-home-layout-v1").getOrDefault("showUsageCard", true).equals(true);
            case "simplified_checkout" -> "simplified".equals(getAssignments(customerId).stream()
                .filter(a -> a.experimentId().equals("exp-checkout-flow-v1"))
                .findFirst()
                .map(ExperimentAssignment::variant)
                .orElse("control"));
            case "roaming_grid" -> "grid".equals(getAssignments(customerId).stream()
                .filter(a -> a.experimentId().equals("exp-roaming-packs-v1"))
                .findFirst()
                .map(ExperimentAssignment::variant)
                .orElse("control"));
            default -> false;
        };
    }
}
