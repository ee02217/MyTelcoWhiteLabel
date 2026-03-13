package com.mytelco.customerbff.model;

import jakarta.validation.constraints.NotBlank;

public record TroubleshootingSessionStepRequest(
    @NotBlank String stepId,
    String notes
) {
}
