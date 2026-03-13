package com.mytelco.customerbff.model;

import java.time.Instant;

public record NotificationChannelDelivery(
    NotificationChannel channel,
    NotificationDeliveryStatus status,
    Instant updatedAt
) {}
