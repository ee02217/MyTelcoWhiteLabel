package com.mytelco.customerbff.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record NotificationPreferencesUpdateRequest(
    @NotEmpty List<@Valid NotificationCategoryPreferenceUpdate> categories
) {}
