package com.mytelco.customerbff.profile;

import java.util.List;

public record CustomerProfile(
    String customerId,
    String firstName,
    String lastName,
    String email,
    String phone,
    String preferredLanguage,
    NotificationPreferences notificationPrefs,
    List<AccountSession> sessions,
    String createdAt,
    String updatedAt
) {}

record NotificationPreferences(
    boolean pushEnabled,
    boolean smsEnabled,
    boolean emailEnabled,
    boolean marketingEmails
) {}

record AccountSession(
    String sessionId,
    String deviceType,
    String deviceName,
    String ipAddress,
    String lastActive,
    String createdAt,
    boolean currentSession
) {}
