package com.mytelco.customerbff.model;

import jakarta.validation.constraints.NotBlank;

public record SimActionRequest(
    @NotBlank String stepUpVerificationToken,
    String reason
) {}
