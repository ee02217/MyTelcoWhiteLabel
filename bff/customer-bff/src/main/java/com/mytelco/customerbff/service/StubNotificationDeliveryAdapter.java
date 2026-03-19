package com.mytelco.customerbff.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "mytelco.notifications.delivery", name = "provider", havingValue = "stub", matchIfMissing = true)
public class StubNotificationDeliveryAdapter implements NotificationDeliveryAdapter {

    private static final Logger LOGGER = LoggerFactory.getLogger(StubNotificationDeliveryAdapter.class);

    @Override
    public NotificationDeliveryResult deliver(NotificationDeliveryRequest request) {
        String providerRef = "stub-" + request.channel().name().toLowerCase() + "-" + request.notificationId() + "-" + request.attempt();
        LOGGER.info(
            "stub notification delivery: channel={} customer={} notificationId={} attempt={} providerRef={}",
            request.channel(),
            request.customerId(),
            request.notificationId(),
            request.attempt(),
            providerRef
        );
        return NotificationDeliveryResult.delivered("stub", providerRef);
    }
}
