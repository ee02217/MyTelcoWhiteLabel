package com.mytelco.customerbff.service.status;

import java.time.Instant;

public record IncidentNotificationPreference(
    String preferenceId,
    String customerId,
    String lineId,
    String regionCode,
    String serviceType,
    boolean notifyOnStart,
    boolean notifyOnUpdate,
    boolean notifyOnResolved,
    Instant createdAt
) {}
