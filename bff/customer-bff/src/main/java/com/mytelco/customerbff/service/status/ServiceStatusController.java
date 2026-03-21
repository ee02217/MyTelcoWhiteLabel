package com.mytelco.customerbff.service.status;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/customer/status")
public class ServiceStatusController {

    private final ServiceStatusService serviceStatusService;
    private final IncidentNotificationService incidentNotificationService;

    public ServiceStatusController(
        ServiceStatusService serviceStatusService,
        IncidentNotificationService incidentNotificationService
    ) {
        this.serviceStatusService = serviceStatusService;
        this.incidentNotificationService = incidentNotificationService;
    }

    @GetMapping("/regions")
    public ResponseEntity<List<RegionStatus>> getAllRegionStatuses() {
        return ResponseEntity.ok(serviceStatusService.getAllRegionStatuses());
    }

    @GetMapping("/regions/{regionPrefix}")
    public ResponseEntity<List<RegionStatus>> getRegionStatusesByGeography(
        @PathVariable String regionPrefix
    ) {
        return ResponseEntity.ok(serviceStatusService.getRegionStatusesByGeography(regionPrefix));
    }

    @GetMapping("/incidents")
    public ResponseEntity<List<Incident>> getActiveIncidents(
        @RequestParam(required = false, defaultValue = "false") boolean includeResolved
    ) {
        if (includeResolved) {
            return ResponseEntity.ok(serviceStatusService.getAllIncidents());
        }
        return ResponseEntity.ok(serviceStatusService.getActiveIncidents());
    }

    @GetMapping("/incidents/{incidentId}")
    public ResponseEntity<Incident> getIncident(@PathVariable String incidentId) {
        Incident incident = serviceStatusService.getIncident(incidentId);
        if (incident == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(incident);
    }

    @GetMapping("/incidents/{incidentId}/timeline")
    public ResponseEntity<List<IncidentUpdate>> getIncidentTimeline(@PathVariable String incidentId) {
        return ResponseEntity.ok(serviceStatusService.getIncidentUpdates(incidentId));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<ServiceType, String>> getHealthSummary() {
        return ResponseEntity.ok(serviceStatusService.getServiceHealthSummary());
    }

    @GetMapping("/notifications/preferences")
    public ResponseEntity<List<IncidentNotificationPreference>> getNotificationPreferences(
        @RequestHeader("X-Customer-ID") String customerId
    ) {
        return ResponseEntity.ok(incidentNotificationService.getPreferences(customerId));
    }

    @PostMapping("/notifications/preferences")
    public ResponseEntity<IncidentNotificationPreference> createNotificationPreference(
        @RequestHeader("X-Customer-ID") String customerId,
        @RequestBody CreatePreferenceRequest request
    ) {
        var pref = incidentNotificationService.createPreference(
            customerId,
            request.lineId(),
            request.regionCode(),
            request.serviceType(),
            request.notifyOnStart(),
            request.notifyOnUpdate(),
            request.notifyOnResolved()
        );
        return ResponseEntity.ok(pref);
    }

    @DeleteMapping("/notifications/preferences/{preferenceId}")
    public ResponseEntity<Void> deletePreference(@PathVariable String preferenceId) {
        incidentNotificationService.deletePreference(preferenceId);
        return ResponseEntity.noContent().build();
    }
}

record CreatePreferenceRequest(
    String lineId,
    String regionCode,
    String serviceType,
    boolean notifyOnStart,
    boolean notifyOnUpdate,
    boolean notifyOnResolved
) {}
