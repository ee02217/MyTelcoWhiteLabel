package com.mytelco.customerbff.service;

import com.mytelco.customerbff.config.StepUpSecurityProperties;
import com.mytelco.customerbff.model.StepUpAction;
import com.mytelco.customerbff.model.StepUpChallengeRequest;
import com.mytelco.customerbff.model.StepUpChallengeResponse;
import com.mytelco.customerbff.model.StepUpVerifyRequest;
import com.mytelco.customerbff.model.StepUpVerifyResponse;
import com.mytelco.customerbff.provider.StepUpAuthProvider;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class StepUpAuthService {

    private final StepUpAuthProvider provider;
    private final StepUpSecurityProperties securityProperties;
    private final StepUpCodeGenerator stepUpCodeGenerator;
    private final StepUpChallengeDeliveryAdapter challengeDeliveryAdapter;
    private final StepUpAuditPublisher auditPublisher;

    public StepUpAuthService(
        StepUpAuthProvider provider,
        StepUpSecurityProperties securityProperties,
        StepUpCodeGenerator stepUpCodeGenerator,
        StepUpChallengeDeliveryAdapter challengeDeliveryAdapter,
        StepUpAuditPublisher auditPublisher
    ) {
        this.provider = provider;
        this.securityProperties = securityProperties;
        this.stepUpCodeGenerator = stepUpCodeGenerator;
        this.challengeDeliveryAdapter = challengeDeliveryAdapter;
        this.auditPublisher = auditPublisher;
    }

    public StepUpChallengeResponse createChallenge(StepUpChallengeRequest request) {
        Instant expiresAt = Instant.now().plus(securityProperties.getChallengeTtl());
        String otp = stepUpCodeGenerator.generateCode(securityProperties.getOtpLength());

        StepUpAuthProvider.ChallengeState state = provider.createChallenge(request.lineId(), request.action(), expiresAt, otp);
        StepUpChallengeDeliveryResult deliveryResult = challengeDeliveryAdapter.deliverChallenge(
            state.challengeId(),
            request.lineId(),
            request.action(),
            otp
        );

        auditPublisher.publish(
            "STEP_UP_CHALLENGE_ISSUED",
            request.lineId(),
            request.action(),
            state.challengeId(),
            "channel=" + deliveryResult.channel()
        );

        return new StepUpChallengeResponse(
            state.challengeId(),
            request.lineId(),
            request.action(),
            expiresAt,
            deliveryResult.maskedDestination(),
            "Step-up challenge issued"
        );
    }

    public StepUpVerifyResponse verifyChallenge(StepUpVerifyRequest request) {
        Instant now = Instant.now();
        StepUpAuthProvider.ChallengeState challenge = provider.getChallenge(request.challengeId());

        if (challenge == null) {
            throw StepUpAuthException.challengeNotFound(request.challengeId());
        }

        if (challenge.isConsumed()) {
            auditPublisher.publish(
                "STEP_UP_CHALLENGE_REPLAY_REJECTED",
                challenge.lineId(),
                challenge.action(),
                challenge.challengeId(),
                "challenge already consumed"
            );
            throw StepUpAuthException.challengeAlreadyUsed(challenge.challengeId());
        }

        if (challenge.isLocked(now)) {
            auditPublisher.publish(
                "STEP_UP_CHALLENGE_LOCKED_REJECTED",
                challenge.lineId(),
                challenge.action(),
                challenge.challengeId(),
                "challenge is temporarily locked"
            );
            throw StepUpAuthException.challengeLocked(challenge.challengeId());
        }

        if (challenge.isExpired(now)) {
            auditPublisher.publish(
                "STEP_UP_CHALLENGE_EXPIRED",
                challenge.lineId(),
                challenge.action(),
                challenge.challengeId(),
                "challenge expired"
            );
            throw StepUpAuthException.challengeExpired(challenge.challengeId());
        }

        if (!challenge.expectedCode().equals(request.code())) {
            int failedAttempts = challenge.failedAttempts() + 1;
            int remainingAttempts = securityProperties.getMaxAttempts() - failedAttempts;
            Instant lockUntil = null;
            if (failedAttempts >= securityProperties.getMaxAttempts()) {
                lockUntil = now.plus(securityProperties.getLockoutDuration());
            }

            StepUpAuthProvider.ChallengeState updatedChallenge = challenge.withFailedAttempt(failedAttempts, lockUntil);
            provider.saveChallenge(updatedChallenge);

            if (lockUntil != null) {
                auditPublisher.publish(
                    "STEP_UP_CHALLENGE_LOCKED",
                    challenge.lineId(),
                    challenge.action(),
                    challenge.challengeId(),
                    "failedAttempts=" + failedAttempts
                );
                throw StepUpAuthException.challengeLocked(challenge.challengeId());
            }

            auditPublisher.publish(
                "STEP_UP_CHALLENGE_VERIFICATION_FAILED",
                challenge.lineId(),
                challenge.action(),
                challenge.challengeId(),
                "failedAttempts=" + failedAttempts
            );
            throw StepUpAuthException.invalidCode(challenge.challengeId(), remainingAttempts);
        }

        provider.saveChallenge(challenge.consume(now));

        Instant expiresAt = now.plus(securityProperties.getVerificationTokenTtl());
        StepUpAuthProvider.VerificationState token = provider.issueVerificationToken(challenge.lineId(), challenge.action(), expiresAt);

        auditPublisher.publish(
            "STEP_UP_CHALLENGE_VERIFIED",
            challenge.lineId(),
            challenge.action(),
            challenge.challengeId(),
            "token issued"
        );

        return new StepUpVerifyResponse(token.token(), expiresAt, "Step-up verified");
    }

    public boolean isVerificationTokenValid(String token, String lineId, StepUpAction action) {
        StepUpAuthProvider.VerificationState state = provider.getVerificationToken(token);
        return state != null
            && !state.expiresAt().isBefore(Instant.now())
            && state.lineId().equals(lineId)
            && state.action() == action;
    }
}
