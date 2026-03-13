package com.mytelco.customerbff.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record StepUpChallengeRequest(
    @NotBlank String lineId,
    @NotNull StepUpAction action
) {}
