package com.mytelco.customerbff.model;

import jakarta.validation.constraints.NotBlank;

public record TroubleshootingSessionStartRequest(
    @NotBlank String flowId,
    @NotBlank String lineId,
    @NotBlank String deviceInfo,
    String location
) {
}
