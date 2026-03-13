package com.mytelco.customerbff.model;

import jakarta.validation.constraints.NotBlank;

public record TroubleshootingResolveRequest(
    @NotBlank String outcome,
    String notes
) {
}
