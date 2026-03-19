package com.mytelco.customerbff.provider;

import com.mytelco.customerbff.model.StepUpAction;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class StepUpAuthProvider {

    private final Map<String, ChallengeState> challenges = new ConcurrentHashMap<>();
    private final Map<String, VerificationState> verificationTokens = new ConcurrentHashMap<>();

    public ChallengeState createChallenge(String lineId, StepUpAction action, Instant expiresAt, String expectedCode) {
        String challengeId = "stp_" + UUID.randomUUID();
        ChallengeState state = new ChallengeState(challengeId, lineId, action, expectedCode, expiresAt, 0, null, null);
        challenges.put(challengeId, state);
        return state;
    }

    public ChallengeState getChallenge(String challengeId) {
        return challenges.get(challengeId);
    }

    public ChallengeState saveChallenge(ChallengeState state) {
        challenges.put(state.challengeId(), state);
        return state;
    }

    public VerificationState issueVerificationToken(String lineId, StepUpAction action, Instant expiresAt) {
        String token = "stv_" + UUID.randomUUID();
        VerificationState state = new VerificationState(token, lineId, action, expiresAt);
        verificationTokens.put(token, state);
        return state;
    }

    public VerificationState getVerificationToken(String token) {
        return verificationTokens.get(token);
    }

    public record ChallengeState(
        String challengeId,
        String lineId,
        StepUpAction action,
        String expectedCode,
        Instant expiresAt,
        int failedAttempts,
        Instant lockedUntil,
        Instant consumedAt
    ) {
        public boolean isExpired(Instant now) {
            return expiresAt.isBefore(now);
        }

        public boolean isLocked(Instant now) {
            return lockedUntil != null && lockedUntil.isAfter(now);
        }

        public boolean isConsumed() {
            return consumedAt != null;
        }

        public ChallengeState withFailedAttempt(int attempts, Instant lockUntil) {
            return new ChallengeState(
                challengeId,
                lineId,
                action,
                expectedCode,
                expiresAt,
                attempts,
                lockUntil,
                consumedAt
            );
        }

        public ChallengeState consume(Instant consumedAtInstant) {
            return new ChallengeState(
                challengeId,
                lineId,
                action,
                expectedCode,
                expiresAt,
                failedAttempts,
                lockedUntil,
                consumedAtInstant
            );
        }
    }

    public record VerificationState(String token, String lineId, StepUpAction action, Instant expiresAt) {}
}
