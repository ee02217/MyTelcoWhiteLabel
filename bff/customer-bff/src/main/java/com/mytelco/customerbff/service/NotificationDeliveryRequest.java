package com.mytelco.customerbff.service;

import com.mytelco.customerbff.model.NotificationCategory;
import com.mytelco.customerbff.model.NotificationChannel;

public record NotificationDeliveryRequest(
    String notificationId,
    String customerId,
    NotificationCategory category,
    NotificationChannel channel,
    String title,
    String message,
    int attempt
) {}
