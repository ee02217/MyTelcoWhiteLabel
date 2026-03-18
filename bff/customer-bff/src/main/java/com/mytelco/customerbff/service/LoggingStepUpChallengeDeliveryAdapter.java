package com.mytelco.customerbff.service;

import com.mytelco.customerbff.config.StepUpSecurityProperties;
import com.mytelco.customerbff.model.StepUpAction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "mytelco.step-up.delivery", name = "provider", havingValue = "stub", matchIfMissing = true)
public class LoggingStepUpChallengeDeliveryAdapter implements StepUpChallengeDeliveryAdapter {

    private static final Logger log = LoggerFactory.getLogger(LoggingStepUpChallengeDeliveryAdapter.class);

    private final StepUpSecurityProperties properties;

    public LoggingStepUpChallengeDeliveryAdapter(StepUpSecurityProperties properties) {
        this.properties = properties;
    }

    @Override
    public StepUpChallengeDeliveryResult deliverChallenge(String challengeId, String lineId, StepUpAction action, String code) {
        log.info(
            "step-up challenge delivery stub challengeId={} lineId={} action={} channel={} otp={}",
            challengeId,
            lineId,
            action,
            properties.getDelivery().getChannel(),
            code
        );

        return new StepUpChallengeDeliveryResult(
            properties.getDelivery().getChannel(),
            properties.getDelivery().getMaskedDestination(),
            "stub-" + challengeId
        );
    }
}
