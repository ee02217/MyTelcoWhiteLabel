package com.mytelco.customerbff.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record NotificationTestSendRequest(
    @NotBlank String title,
    @NotBlank String message,
    @NotNull NotificationCategory category,
    List<NotificationChannel> requestedChannels,
    List<NotificationChannel> forceFailedChannels
) {}
