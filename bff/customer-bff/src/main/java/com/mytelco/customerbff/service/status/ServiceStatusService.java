package com.mytelco.customerbff.service.status;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.Arrays;
import java.util.stream.Collectors;

@Service
public class ServiceStatusService {

    private final Map<String, RegionStatus> regionStatuses = new HashMap<>();
    private final Map<String, Incident> incidents = new HashMap<>();
    private final Map<String, List<IncidentUpdate>> incidentUpdates = new HashMap<>();

    public ServiceStatusService() {
        initializeMockData();
    }

    private void initializeMockData() {
        // Mock region statuses
        List<String> regions = List.of("PT-NORTH", "PT-CENTRAL", "PT-SOUTH", "ES-MAD", "ES-BCN", "FR-PARIS");
        List<ServiceType> services = List.of(ServiceType.MOBILE_DATA, ServiceType.VOICE_CALLS, ServiceType.SMS, ServiceType.ROAMING);

        for (String region : regions) {
            for (ServiceType service : services) {
                String status = Math.random() > 0.9 ? "DEGRADED" : "OPERATIONAL";
                regionStatuses.put(region + "-" + service.name(), new RegionStatus(
                    region, getRegionName(region), service, status, Instant.now().toString()
                ));
            }
        }

        // Mock incidents
        Incident incident1 = new Incident(
            "INC-001", "Network maintenance in Lisbon", "Scheduled maintenance",
            ServiceType.MOBILE_DATA, "MAINTENANCE", "IN_PROGRESS", "PT-CENTRAL",
            Instant.now().minusSeconds(7200), Instant.now(), null,
            "Maintenance in progress. Expected completion: 22:00."
        );
        incidents.put(incident1.incidentId(), incident1);

        Incident incident2 = new Incident(
            "INC-002", "Reduced roaming capacity", "High traffic in Barcelona",
            ServiceType.ROAMING, "WARNING", "INVESTIGATING", "ES-BCN",
            Instant.now().minusSeconds(3600), Instant.now(), null,
            "Engineers are investigating degraded roaming services in Barcelona region."
        );
        incidents.put(incident2.incidentId(), incident2);

        // Mock incident updates
        List<IncidentUpdate> updates1 = List.of(
            new IncidentUpdate("U1", "INC-001", "Maintenance scheduled", "SCHEDULED", Instant.now().minusSeconds(14400)),
            new IncidentUpdate("U2", "INC-001", "Maintenance started", "IN_PROGRESS", Instant.now().minusSeconds(7200))
        );
        incidentUpdates.put("INC-001", updates1);

        List<IncidentUpdate> updates2 = List.of(
            new IncidentUpdate("U3", "INC-002", "Issue reported", "IDENTIFIED", Instant.now().minusSeconds(3600)),
            new IncidentUpdate("U4", "INC-002", "Investigating root cause", "INVESTIGATING", Instant.now().minusSeconds(1800))
        );
        incidentUpdates.put("INC-002", updates2);
    }

    private String getRegionName(String code) {
        return switch (code) {
            case "PT-NORTH" -> "Northern Portugal";
            case "PT-CENTRAL" -> "Central Portugal";
            case "PT-SOUTH" -> "Southern Portugal";
            case "ES-MAD" -> "Madrid, Spain";
            case "ES-BCN" -> "Barcelona, Spain";
            case "FR-PARIS" -> "Paris, France";
            default -> code;
        };
    }

    public List<RegionStatus> getAllRegionStatuses() {
        return new ArrayList<>(regionStatuses.values());
    }

    public List<RegionStatus> getRegionStatusesByGeography(String regionPrefix) {
        return regionStatuses.values().stream()
            .filter(r -> r.regionCode().startsWith(regionPrefix))
            .collect(Collectors.toList());
    }

    public List<Incident> getActiveIncidents() {
        return incidents.values().stream()
            .filter(i -> !i.status().equals("RESOLVED"))
            .sorted(Comparator.comparing(Incident::startedAt).reversed())
            .collect(Collectors.toList());
    }

    public List<Incident> getAllIncidents() {
        return incidents.values().stream()
            .sorted(Comparator.comparing(Incident::startedAt).reversed())
            .collect(Collectors.toList());
    }

    public Incident getIncident(String incidentId) {
        return incidents.get(incidentId);
    }

    public List<IncidentUpdate> getIncidentUpdates(String incidentId) {
        return incidentUpdates.getOrDefault(incidentId, List.of());
    }

    public Map<ServiceType, String> getServiceHealthSummary() {
        Map<ServiceType, Long> byService = regionStatuses.values().stream()
            .collect(Collectors.groupingBy(RegionStatus::serviceType, Collectors.counting()));

        Map<ServiceType, Long> degraded = regionStatuses.values().stream()
            .filter(r -> !r.status().equals("OPERATIONAL"))
            .collect(Collectors.groupingBy(RegionStatus::serviceType, Collectors.counting()));

        return Arrays.stream(ServiceType.values()).collect(Collectors.toMap(
            s -> s,
            s -> {
                long total = byService.getOrDefault(s, 0L);
                long bad = degraded.getOrDefault(s, 0L);
                if (total == 0) return "UNKNOWN";
                if (bad == 0) return "OPERATIONAL";
                if (bad < total / 2) return "DEGRADED";
                return "OUTAGE";
            }
        ));
    }
}
