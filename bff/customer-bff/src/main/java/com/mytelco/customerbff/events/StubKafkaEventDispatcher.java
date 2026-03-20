package com.mytelco.customerbff.events;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "mytelco.events.dispatch", name = "mode", havingValue = "stub", matchIfMissing = true)
public class StubKafkaEventDispatcher implements DomainEventDispatcher {

    private static final Logger LOGGER = LoggerFactory.getLogger(StubKafkaEventDispatcher.class);

    private final EventBackboneProperties properties;

    public StubKafkaEventDispatcher(EventBackboneProperties properties) {
        this.properties = properties;
    }

    @Override
    public void dispatch(DomainEventEnvelope eventEnvelope) {
        if (properties.getDispatch().getFailOnTopics().stream()
            .anyMatch(topic -> topic.equalsIgnoreCase(eventEnvelope.topic()))) {
            throw new IllegalStateException("Configured dispatch failure for topic=" + eventEnvelope.topic());
        }

        if (properties.getDispatch().getFailOnEventTypes().stream()
            .anyMatch(eventType -> eventType.equalsIgnoreCase(eventEnvelope.eventType()))) {
            throw new IllegalStateException("Configured dispatch failure for eventType=" + eventEnvelope.eventType());
        }

        LOGGER.info(
            "KAFKA_STUB_DISPATCH topic={} eventType={} schemaVersion={} eventId={} customerId={} correlationId={}",
            eventEnvelope.topic(),
            eventEnvelope.eventType(),
            eventEnvelope.schemaVersion(),
            eventEnvelope.eventId(),
            eventEnvelope.customerId(),
            eventEnvelope.correlationId()
        );
    }
}
