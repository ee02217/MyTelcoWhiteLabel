package com.mytelco.customerbff.model;

import java.time.Instant;

public record StepUpVerifyResponse(
    String verificationToken,
    Instant expiresAt,
    String message
) {}
