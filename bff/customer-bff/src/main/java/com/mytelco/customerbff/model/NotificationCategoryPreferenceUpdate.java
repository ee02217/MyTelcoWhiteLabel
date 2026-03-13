package com.mytelco.customerbff.model;

import jakarta.validation.constraints.NotNull;

import java.util.Map;

public record NotificationCategoryPreferenceUpdate(
    @NotNull NotificationCategory category,
    @NotNull Map<NotificationChannel, Boolean> channels
) {}
