package com.mytelco.customerbff.model;

import jakarta.validation.constraints.NotBlank;

public record StepUpVerifyRequest(
    @NotBlank String challengeId,
    @NotBlank String code
) {}
