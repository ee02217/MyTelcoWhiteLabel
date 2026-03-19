package com.mytelco.customerbff.service;

import com.mytelco.customerbff.config.NotificationDeliveryProperties;
import com.mytelco.customerbff.model.AlertInboxItem;
import com.mytelco.customerbff.model.NotificationCategory;
import com.mytelco.customerbff.model.NotificationChannel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class StubPushNotificationDispatcher implements PushNotificationDispatcher {

    private static final Logger LOGGER = LoggerFactory.getLogger(StubPushNotificationDispatcher.class);

    private final NotificationDeliveryAdapter deliveryAdapter;
    private final NotificationDeliveryProperties deliveryProperties;

    public StubPushNotificationDispatcher(
        NotificationDeliveryAdapter deliveryAdapter,
        NotificationDeliveryProperties deliveryProperties
    ) {
        this.deliveryAdapter = deliveryAdapter;
        this.deliveryProperties = deliveryProperties;
    }

    @Override
    public void dispatch(AlertInboxItem notification) {
        int maxAttempts = Math.max(1, deliveryProperties.getDelivery().getMaxAttempts());

        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            NotificationDeliveryResult result = deliveryAdapter.deliver(new NotificationDeliveryRequest(
                notification.id(),
                notification.customerId(),
                NotificationCategory.SERVICE,
                NotificationChannel.PUSH,
                "Usage threshold alert",
                notification.message(),
                attempt
            ));

            if (result != null && result.delivered()) {
                LOGGER.info(
                    "push delivery succeeded customer={} line={} threshold={} attempt={} provider={} ref={}",
                    notification.customerId(),
                    notification.lineId(),
                    notification.thresholdPercent(),
                    attempt,
                    result.provider(),
                    result.providerReference()
                );
                return;
            }

            String errorCode = result == null ? "DISPATCHER_RETURNED_NULL" : result.errorCode();
            String errorMessage = result == null ? "Dispatcher returned null result" : result.errorMessage();
            LOGGER.warn(
                "push delivery failed customer={} line={} threshold={} attempt={}/{} provider={} code={} message={}",
                notification.customerId(),
                notification.lineId(),
                notification.thresholdPercent(),
                attempt,
                maxAttempts,
                result == null ? deliveryProperties.getDelivery().getProvider() : result.provider(),
                errorCode,
                errorMessage
            );
        }

        LOGGER.error(
            "push delivery reached terminal failure customer={} line={} threshold={} after {} attempts",
            notification.customerId(),
            notification.lineId(),
            notification.thresholdPercent(),
            maxAttempts
        );
    }
}
