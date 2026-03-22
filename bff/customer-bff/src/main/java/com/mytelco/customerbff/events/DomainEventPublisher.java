package com.mytelco.customerbff.events;

import java.util.Map;

public interface DomainEventPublisher {

    void publish(
        EventTopic topic,
        String eventType,
        String customerId,
        String correlationId,
        Map<String, Object> payload
    );
}
