package com.mytelco.customerbff.service;

import java.util.Map;
import java.util.UUID;

import com.mytelco.customerbff.config.NotificationDeliveryProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

@Component
@ConditionalOnProperty(prefix = "mytelco.notifications.delivery", name = "provider", havingValue = "webhook")
public class WebhookNotificationDeliveryAdapter implements NotificationDeliveryAdapter {

    private final NotificationDeliveryProperties properties;
    private final RestClient restClient;

    public WebhookNotificationDeliveryAdapter(
        NotificationDeliveryProperties properties,
        RestClient.Builder restClientBuilder
    ) {
        this.properties = properties;
        this.restClient = restClientBuilder.build();
    }

    @Override
    public NotificationDeliveryResult deliver(NotificationDeliveryRequest request) {
        String webhookUrl = properties.getDelivery().getWebhookUrl();
        if (!StringUtils.hasText(webhookUrl)) {
            return NotificationDeliveryResult.failed(
                "webhook",
                "WEBHOOK_CONFIG_MISSING",
                "mytelco.notifications.delivery.webhook-url is required when provider=webhook"
            );
        }

        try {
            restClient.post()
                .uri(webhookUrl)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of(
                    "notificationId", request.notificationId(),
                    "customerId", request.customerId(),
                    "category", request.category().name(),
                    "channel", request.channel().name(),
                    "title", request.title(),
                    "message", request.message(),
                    "attempt", request.attempt()
                ))
                .retrieve()
                .toBodilessEntity();

            return NotificationDeliveryResult.delivered("webhook", "webhook-" + UUID.randomUUID());
        } catch (Exception ex) {
            return NotificationDeliveryResult.failed("webhook", "WEBHOOK_DELIVERY_ERROR", ex.getMessage());
        }
    }
}
