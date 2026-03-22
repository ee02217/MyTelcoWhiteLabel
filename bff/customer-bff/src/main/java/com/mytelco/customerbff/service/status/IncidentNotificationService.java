package com.mytelco.customerbff.service.status;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class IncidentNotificationService {

    private final Map<String, IncidentNotificationPreference> preferences = new ConcurrentHashMap<>();
    private int preferenceIdCounter = 1;

    public List<IncidentNotificationPreference> getPreferences(String customerId) {
        return preferences.values().stream()
            .filter(p -> p.customerId().equals(customerId))
            .toList();
    }

    public IncidentNotificationPreference createPreference(
        String customerId,
        String lineId,
        String regionCode,
        String serviceType,
        boolean notifyOnStart,
        boolean notifyOnUpdate,
        boolean notifyOnResolved
    ) {
        String prefId = "PREF-" + (preferenceIdCounter++);
        var pref = new IncidentNotificationPreference(
            prefId, customerId, lineId, regionCode, serviceType,
            notifyOnStart, notifyOnUpdate, notifyOnResolved, Instant.now()
        );
        preferences.put(prefId, pref);
        return pref;
    }

    public void deletePreference(String preferenceId) {
        preferences.remove(preferenceId);
    }

    public List<Incident> getAffectedIncidents(String regionCode, String serviceType) {
        // Return incidents that match region/service and are active
        return List.of();
    }
}
