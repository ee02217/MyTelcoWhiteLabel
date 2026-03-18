package com.mytelco.customerbff.model;

import java.time.Instant;

public record NotificationChannelDelivery(
    NotificationChannel channel,
    NotificationDeliveryStatus status,
    Instant updatedAt,
    int attempt,
    String provider,
    String providerReference,
    String errorCode,
    String errorMessage
) {

    public NotificationChannelDelivery(
        NotificationChannel channel,
        NotificationDeliveryStatus status,
        Instant updatedAt
    ) {
        this(channel, status, updatedAt, 0, null, null, null, null);
    }
}
