package com.mytelco.customerbff.model;

import java.time.Instant;
import java.util.List;

public record NotificationInboxItem(
    String notificationId,
    String customerId,
    String title,
    String message,
    NotificationCategory category,
    List<NotificationChannelDelivery> deliveries,
    Instant createdAt,
    Instant readAt
) {}
