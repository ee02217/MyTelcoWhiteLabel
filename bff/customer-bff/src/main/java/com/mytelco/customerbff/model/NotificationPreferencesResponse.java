package com.mytelco.customerbff.model;

import java.time.Instant;
import java.util.List;

public record NotificationPreferencesResponse(
    String customerId,
    List<NotificationCategoryPreference> categories,
    Instant updatedAt,
    String updatedBy
) {}
