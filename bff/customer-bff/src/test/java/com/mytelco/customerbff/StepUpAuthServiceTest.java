package com.mytelco.customerbff;

import com.mytelco.customerbff.model.StepUpAction;
import com.mytelco.customerbff.model.StepUpChallengeRequest;
import com.mytelco.customerbff.model.StepUpVerifyRequest;
import com.mytelco.customerbff.provider.StepUpAuthProvider;
import com.mytelco.customerbff.config.StepUpSecurityProperties;
import com.mytelco.customerbff.service.StepUpAuthException;
import com.mytelco.customerbff.service.StepUpAuthService;
import com.mytelco.customerbff.service.StepUpAuditPublisher;
import com.mytelco.customerbff.service.StepUpChallengeDeliveryAdapter;
import com.mytelco.customerbff.service.StepUpChallengeDeliveryResult;
import com.mytelco.customerbff.service.StepUpCodeGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class StepUpAuthServiceTest {

    private StepUpAuthService service;
    private StepUpAuthProvider provider;

    @BeforeEach
    void setUp() {
        provider = new StepUpAuthProvider();
        StepUpSecurityProperties properties = new StepUpSecurityProperties();
        properties.setMaxAttempts(3);
        properties.setLockoutDuration(Duration.ofMinutes(5));
        StepUpCodeGenerator generator = length -> "123456";
        StepUpChallengeDeliveryAdapter deliveryAdapter = (challengeId, lineId, action, code) ->
            new StepUpChallengeDeliveryResult("SMS", "+*** *** *42", "stub-" + challengeId);
        StepUpAuditPublisher auditPublisher = (event, lineId, action, challengeId, detail) -> {};
        service = new StepUpAuthService(provider, properties, generator, deliveryAdapter, auditPublisher);
    }

    @Test
    void createAndVerifyChallengeSucceeds() {
        var response = service.createChallenge(new StepUpChallengeRequest("line-1", StepUpAction.SIM_BLOCK));
        var stored = provider.getChallenge(response.challengeId());

        var token = service.verifyChallenge(new StepUpVerifyRequest(response.challengeId(), stored.expectedCode()));

        assertThat(token.verificationToken()).startsWith("stv_");
        assertThat(service.isVerificationTokenValid(token.verificationToken(), "line-1", StepUpAction.SIM_BLOCK)).isTrue();
    }

    @Test
    void invalidCodeIncrementsAttemptsAndLocksAfterMax() {
        var response = service.createChallenge(new StepUpChallengeRequest("line-2", StepUpAction.SIM_BLOCK));
        var stored = provider.getChallenge(response.challengeId());

        assertThatThrownBy(() -> {
            failVerification(response.challengeId(), "000000");
        }).isInstanceOf(StepUpAuthException.class);
        assertThat(provider.getChallenge(response.challengeId()).failedAttempts()).isEqualTo(1);

        assertThatThrownBy(() -> failVerification(response.challengeId(), "000000"))
            .isInstanceOf(StepUpAuthException.class)
            .hasMessageContaining("Remaining attempts: 1");
        assertThat(provider.getChallenge(response.challengeId()).failedAttempts()).isEqualTo(2);

        assertThatThrownBy(() -> failVerification(response.challengeId(), "000000"))
            .isInstanceOf(StepUpAuthException.class)
            .hasMessageContaining("temporarily locked");
        assertThat(provider.getChallenge(response.challengeId()).isLocked(java.time.Instant.now())).isTrue();
    }

    private void failVerification(String challengeId, String code) {
        service.verifyChallenge(new StepUpVerifyRequest(challengeId, code));
    }
}
