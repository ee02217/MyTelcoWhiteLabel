package com.mytelco.customerbff;

import com.mytelco.customerbff.model.SimActionResponse;
import com.mytelco.customerbff.model.StepUpAction;
import com.mytelco.customerbff.model.StepUpChallengeRequest;
import com.mytelco.customerbff.model.StepUpVerifyRequest;
import com.mytelco.customerbff.provider.SimLifecycleProvider;
import com.mytelco.customerbff.provider.StepUpAuthProvider;
import com.mytelco.customerbff.config.StepUpSecurityProperties;
import com.mytelco.customerbff.service.SimService;
import com.mytelco.customerbff.service.StepUpAuthService;
import com.mytelco.customerbff.service.StepUpAuditPublisher;
import com.mytelco.customerbff.service.StepUpChallengeDeliveryResult;
import com.mytelco.customerbff.service.StepUpChallengeDeliveryAdapter;
import com.mytelco.customerbff.service.StepUpCodeGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class StepUpAndSimServiceTest {

    private StepUpAuthService stepUp;
    private SimService simService;
    private StepUpAuthProvider provider;

    @BeforeEach
    void setUp() {
        provider = new StepUpAuthProvider();
        StepUpSecurityProperties properties = new StepUpSecurityProperties();
        properties.setOtpLength(6);
        StepUpCodeGenerator generator = length -> "123456";
        StepUpChallengeDeliveryAdapter deliveryAdapter = (challengeId, lineId, action, code) ->
            new StepUpChallengeDeliveryResult("SMS", "+*** *** *42", "stub-" + challengeId);
        StepUpAuditPublisher auditPublisher = (event, lineId, action, challengeId, detail) -> {};
        stepUp = new StepUpAuthService(provider, properties, generator, deliveryAdapter, auditPublisher);
        simService = new SimService(new SimLifecycleProvider());
    }

    @Test
    void simBlockAndUnblockRequireValidStepUpToken() {
        assertThat(stepUp.isVerificationTokenValid("missing", "line-1", StepUpAction.SIM_BLOCK)).isFalse();

        var challenge = stepUp.createChallenge(new StepUpChallengeRequest("line-1", StepUpAction.SIM_BLOCK));
        var stored = provider.getChallenge(challenge.challengeId());
        var token = stepUp.verifyChallenge(new StepUpVerifyRequest(challenge.challengeId(), stored.expectedCode()));

        assertThat(stepUp.isVerificationTokenValid(token.verificationToken(), "line-1", StepUpAction.SIM_BLOCK)).isTrue();

        SimActionResponse blocked = simService.block("line-1");
        assertThat(blocked.previousStatus().name()).isEqualTo("ACTIVE");
        assertThat(blocked.currentStatus().name()).isEqualTo("BLOCKED");
    }
}
