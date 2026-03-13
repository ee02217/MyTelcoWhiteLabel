package com.mytelco.customerbff.model;

import jakarta.validation.constraints.NotBlank;

public record SupportCaseMessageRequest(
    @NotBlank String actor,
    String actorType,
    @NotBlank String message
) {}
