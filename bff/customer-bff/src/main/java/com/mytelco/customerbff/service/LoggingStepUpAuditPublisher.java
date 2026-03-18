package com.mytelco.customerbff.service;

import com.mytelco.customerbff.model.StepUpAction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class LoggingStepUpAuditPublisher implements StepUpAuditPublisher {

    private static final Logger log = LoggerFactory.getLogger(LoggingStepUpAuditPublisher.class);

    @Override
    public void publish(String eventType, String lineId, StepUpAction action, String challengeId, String detail) {
        log.info(
            "step-up-audit event={} lineId={} action={} challengeId={} detail={}",
            eventType,
            lineId,
            action,
            challengeId,
            detail
        );
    }
}
