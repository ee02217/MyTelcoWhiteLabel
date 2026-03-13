package com.mytelco.customerbff.model;

import java.util.List;

public record NotificationCategoryPreference(
    NotificationCategory category,
    List<NotificationChannelPreference> channels
) {}
