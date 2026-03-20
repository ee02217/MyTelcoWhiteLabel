package com.mytelco.customerbff.events;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

@Component
@ConditionalOnProperty(prefix = "mytelco.events.dispatch", name = "mode", havingValue = "kafka")
public class KafkaDomainEventDispatcher implements DomainEventDispatcher {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final EventBackboneProperties properties;

    public KafkaDomainEventDispatcher(
        KafkaTemplate<String, String> kafkaTemplate,
        ObjectMapper objectMapper,
        EventBackboneProperties properties
    ) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
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

        String key = resolveKey(eventEnvelope);
        String payload = toJson(eventEnvelope);
        Duration timeout = normalizeTimeout(properties.getDispatch().getSendTimeout());

        try {
            kafkaTemplate.send(eventEnvelope.topic(), key, payload)
                .get(timeout.toMillis(), TimeUnit.MILLISECONDS);
        } catch (TimeoutException timeoutException) {
            throw new IllegalStateException(
                "Kafka dispatch timeout for eventId=" + eventEnvelope.eventId() +
                    ", topic=" + eventEnvelope.topic(),
                timeoutException
            );
        } catch (Exception exception) {
            throw new IllegalStateException(
                "Kafka dispatch failed for eventId=" + eventEnvelope.eventId() +
                    ", topic=" + eventEnvelope.topic(),
                exception
            );
        }
    }

    private String resolveKey(DomainEventEnvelope eventEnvelope) {
        if (StringUtils.hasText(eventEnvelope.customerId())) {
            return eventEnvelope.customerId();
        }
        if (StringUtils.hasText(eventEnvelope.correlationId())) {
            return eventEnvelope.correlationId();
        }
        return eventEnvelope.eventId();
    }

    private String toJson(DomainEventEnvelope eventEnvelope) {
        try {
            return objectMapper.writeValueAsString(eventEnvelope);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException(
                "Unable to serialize event envelope eventId=" + eventEnvelope.eventId(),
                exception
            );
        }
    }

    private Duration normalizeTimeout(Duration configured) {
        if (configured == null || configured.isNegative() || configured.isZero()) {
            return Duration.ofSeconds(3);
        }
        return configured;
    }
}
