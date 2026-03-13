package com.mytelco.customerbff.model;

import java.time.Instant;

public record EsimActivationResponse(
    String lineId,
    String activationId,
    String qrPayload,
    String qrReference,
    EsimActivationStatus status,
    Instant updatedAt
) {}
