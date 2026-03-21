package com.mytelco.customerbff.profile;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ProfileService {

    private final Map<String, CustomerProfile> profiles = new ConcurrentHashMap<>();

    public ProfileService() {
        // Mock initial profile
        profiles.put("customer-1", new CustomerProfile(
            "customer-1",
            "John",
            "Doe",
            "john.doe@example.com",
            "+351912345678",
            "en-GB",
            new NotificationPreferences(true, true, true, false),
            List.of(
                new AccountSession("sess-1", "MOBILE", "iPhone 15 Pro", "85.123.45.67", 
                    Instant.now().toString(), Instant.now().minusSeconds(3600).toString(), true),
                new AccountSession("sess-2", "WEB", "Chrome on macOS", "85.123.45.68",
                    Instant.now().minusSeconds(86400).toString(), Instant.now().minusSeconds(86400).toString(), false)
            ),
            "2024-01-15T10:00:00Z",
            "2026-03-20T14:30:00Z"
        ));
    }

    public CustomerProfile getProfile(String customerId) {
        return profiles.computeIfAbsent(customerId, this::createDefaultProfile);
    }

    private CustomerProfile createDefaultProfile(String customerId) {
        return new CustomerProfile(
            customerId,
            "First",
            "Last",
            customerId + "@example.com",
            "+351900000000",
            "en-GB",
            new NotificationPreferences(true, true, true, false),
            List.of(new AccountSession(
                "sess-" + System.currentTimeMillis(),
                "MOBILE", "Unknown Device", "0.0.0.0",
                Instant.now().toString(), Instant.now().toString(), true
            )),
            Instant.now().toString(),
            Instant.now().toString()
        );
    }

    public CustomerProfile updateProfile(String customerId, UpdateProfileRequest request) {
        CustomerProfile existing = getProfile(customerId);
        
        CustomerProfile updated = new CustomerProfile(
            existing.customerId(),
            request.firstName() != null ? request.firstName() : existing.firstName(),
            request.lastName() != null ? request.lastName() : existing.lastName(),
            request.email() != null ? request.email() : existing.email(),
            request.phone() != null ? request.phone() : existing.phone(),
            request.preferredLanguage() != null ? request.preferredLanguage() : existing.preferredLanguage(),
            existing.notificationPrefs(),
            existing.sessions(),
            existing.createdAt(),
            Instant.now().toString()
        );
        
        profiles.put(customerId, updated);
        return updated;
    }

    public NotificationPreferences updateNotificationPrefs(String customerId, NotificationPreferences prefs) {
        CustomerProfile existing = getProfile(customerId);
        
        CustomerProfile updated = new CustomerProfile(
            existing.customerId(),
            existing.firstName(),
            existing.lastName(),
            existing.email(),
            existing.phone(),
            existing.preferredLanguage(),
            prefs,
            existing.sessions(),
            existing.createdAt(),
            Instant.now().toString()
        );
        
        profiles.put(customerId, updated);
        return prefs;
    }

    public boolean revokeSession(String customerId, String sessionId) {
        CustomerProfile existing = getProfile(customerId);
        
        List<AccountSession> updatedSessions = existing.sessions().stream()
            .filter(s -> !s.sessionId().equals(sessionId))
            .toList();
        
        if (updatedSessions.size() == existing.sessions().size()) {
            return false; // Session not found
        }
        
        CustomerProfile updated = new CustomerProfile(
            existing.customerId(),
            existing.firstName(),
            existing.lastName(),
            existing.email(),
            existing.phone(),
            existing.preferredLanguage(),
            existing.notificationPrefs(),
            updatedSessions,
            existing.createdAt(),
            Instant.now().toString()
        );
        
        profiles.put(customerId, updated);
        return true;
    }

    public Map<String, String> exportData(String customerId) {
        CustomerProfile profile = getProfile(customerId);
        
        Map<String, String> data = new HashMap<>();
        data.put("customerId", profile.customerId());
        data.put("firstName", profile.firstName());
        data.put("lastName", profile.lastName());
        data.put("email", profile.email());
        data.put("phone", profile.phone());
        data.put("preferredLanguage", profile.preferredLanguage());
        data.put("createdAt", profile.createdAt());
        data.put("exportedAt", Instant.now().toString());
        
        return data;
    }

    public boolean deleteAccount(String customerId) {
        // In production, this would trigger a soft-delete with grace period
        profiles.remove(customerId);
        return true;
    }
}

record UpdateProfileRequest(
    String firstName,
    String lastName,
    String email,
    String phone,
    String preferredLanguage
) {}
