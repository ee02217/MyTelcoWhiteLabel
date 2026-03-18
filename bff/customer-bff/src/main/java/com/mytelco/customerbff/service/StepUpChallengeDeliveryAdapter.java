package com.mytelco.customerbff.service;

import com.mytelco.customerbff.model.StepUpAction;

public interface StepUpChallengeDeliveryAdapter {

    StepUpChallengeDeliveryResult deliverChallenge(String challengeId, String lineId, StepUpAction action, String code);
}
