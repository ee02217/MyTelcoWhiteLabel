package com.mytelco.customerbff.service;

import com.mytelco.customerbff.model.AlertInboxItem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class StubPushNotificationDispatcher implements PushNotificationDispatcher {

    private static final Logger LOGGER = LoggerFactory.getLogger(StubPushNotificationDispatcher.class);

    @Override
    public void dispatch(AlertInboxItem notification) {
        LOGGER.info("Stub push dispatched for customer={} line={} threshold={}pct at {}",
            notification.customerId(), notification.lineId(), notification.thresholdPercent(), notification.createdAt());
    }
}
