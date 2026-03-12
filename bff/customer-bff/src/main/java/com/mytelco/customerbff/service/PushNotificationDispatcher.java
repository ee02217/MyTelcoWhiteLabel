package com.mytelco.customerbff.service;

import com.mytelco.customerbff.model.AlertInboxItem;

public interface PushNotificationDispatcher {
    void dispatch(AlertInboxItem notification);
}
