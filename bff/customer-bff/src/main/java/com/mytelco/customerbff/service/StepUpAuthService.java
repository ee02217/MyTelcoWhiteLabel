package com.mytelco.customerbff.service;

import com.mytelco.customerbff.model.StepUpAction;
import com.mytelco.customerbff.model.StepUpChallengeRequest;
import com.mytelco.customerbff.model.StepUpChallengeResponse;
import com.mytelco.customerbff.model.StepUpVerifyRequest;
import com.mytelco.customerbff.model.StepUpVerifyResponse;
import com.mytelco.customerbff.provider.StepUpAuthProvider;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class StepUpAuthService {

    private static final String MVP_OTP = "123456";

    private final StepUpAuthProvider provider;

    public StepUpAuthService(StepUpAuthProvider provider) {
        this.provider = provider;
    }

    public StepUpChallengeResponse createChallenge(StepUpChallengeRequest request) {
        Instant expiresAt = Instant.now().plus(5, ChronoUnit.MINUTES);
        StepUpAuthProvider.ChallengeState state = provider.createChallenge(request.lineId(), request.action(), expiresAt, MVP_OTP);
        return new StepUpChallengeResponse(
            state.challengeId(),
            request.lineId(),
            request.action(),
            expiresAt,
            "+*** *** *42",
            "MVP step-up challenge issued (stub OTP delivery)"
        );
    }

    public StepUpVerifyResponse verifyChallenge(StepUpVerifyRequest request) {
        StepUpAuthProvider.ChallengeState challenge = provider.getChallenge(request.challengeId());
        if (challenge == null || challenge.expiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Challenge is invalid or expired");
        }
        if (!challenge.expectedCode().equals(request.code())) {
            throw new IllegalArgumentException("Invalid challenge code");
        }

        Instant expiresAt = Instant.now().plus(10, ChronoUnit.MINUTES);
        StepUpAuthProvider.VerificationState token = provider.issueVerificationToken(challenge.lineId(), challenge.action(), expiresAt);
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
