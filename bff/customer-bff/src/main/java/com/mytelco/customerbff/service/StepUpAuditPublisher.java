package com.mytelco.customerbff.service;

import com.mytelco.customerbff.model.StepUpAction;

public interface StepUpAuditPublisher {

    void publish(String eventType, String lineId, StepUpAction action, String challengeId, String detail);
}
