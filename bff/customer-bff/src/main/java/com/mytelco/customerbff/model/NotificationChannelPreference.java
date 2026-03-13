package com.mytelco.customerbff.model;

public record NotificationChannelPreference(
    NotificationChannel channel,
    boolean enabled
) {}
