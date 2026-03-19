package com.mytelco.customerbff.events;

import java.util.Arrays;

public enum EventTopic {
    USAGE("mytelco.usage.events.v1"),
    BILLING("mytelco.billing.events.v1"),
    PAYMENT("mytelco.payment.events.v1"),
    ORDERS("mytelco.orders.events.v1"),
    NOTIFICATIONS("mytelco.notifications.events.v1");

    private final String topicName;

    EventTopic(String topicName) {
        this.topicName = topicName;
    }

    public String topicName() {
        return topicName;
    }

    public static EventTopic fromValue(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return Arrays.stream(values())
            .filter(topic -> topic.name().equalsIgnoreCase(value) || topic.topicName.equalsIgnoreCase(value))
            .findFirst()
            .orElse(null);
    }
}
