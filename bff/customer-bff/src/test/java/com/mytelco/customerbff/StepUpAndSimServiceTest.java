package com.mytelco.customerbff;

import com.mytelco.customerbff.model.SimActionResponse;
import com.mytelco.customerbff.model.StepUpAction;
import com.mytelco.customerbff.model.StepUpChallengeRequest;
import com.mytelco.customerbff.model.StepUpVerifyRequest;
import com.mytelco.customerbff.provider.SimLifecycleProvider;
import com.mytelco.customerbff.provider.StepUpAuthProvider;
import com.mytelco.customerbff.service.SimService;
import com.mytelco.customerbff.service.StepUpAuthService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StepUpAndSimServiceTest {

    @Test
    void simBlockAndUnblockRequireValidStepUpToken() {
        StepUpAuthService stepUp = new StepUpAuthService(new StepUpAuthProvider());
        SimService simService = new SimService(new SimLifecycleProvider());

        assertFalse(stepUp.isVerificationTokenValid("missing", "line-1", StepUpAction.SIM_BLOCK));

        var challenge = stepUp.createChallenge(new StepUpChallengeRequest("line-1", StepUpAction.SIM_BLOCK));
        var token = stepUp.verifyChallenge(new StepUpVerifyRequest(challenge.challengeId(), "123456"));

        assertTrue(stepUp.isVerificationTokenValid(token.verificationToken(), "line-1", StepUpAction.SIM_BLOCK));

        SimActionResponse blocked = simService.block("line-1");
        assertEquals("ACTIVE", blocked.previousStatus().name());
        assertEquals("BLOCKED", blocked.currentStatus().name());
    }
}
