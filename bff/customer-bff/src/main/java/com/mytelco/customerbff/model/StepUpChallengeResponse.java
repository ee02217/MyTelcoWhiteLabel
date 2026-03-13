package com.mytelco.customerbff.model;

import java.time.Instant;

public record StepUpChallengeResponse(
    String challengeId,
    String lineId,
    StepUpAction action,
    Instant expiresAt,
    String maskedDestination,
    String message
) {}
