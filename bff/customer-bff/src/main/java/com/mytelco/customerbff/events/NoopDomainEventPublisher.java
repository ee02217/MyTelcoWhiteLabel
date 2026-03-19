package com.mytelco.customerbff.events;

import java.util.Map;

public enum NoopDomainEventPublisher implements DomainEventPublisher {
    INSTANCE;

    @Override
    public void publish(
        EventTopic topic,
        String eventType,
        String customerId,
        String correlationId,
        Map<String, Object> payload
    ) {
        // no-op
    }
}
