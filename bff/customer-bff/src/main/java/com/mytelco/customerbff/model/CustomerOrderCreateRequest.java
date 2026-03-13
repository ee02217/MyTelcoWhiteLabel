package com.mytelco.customerbff.model;

import jakarta.validation.constraints.NotBlank;

public record CustomerOrderCreateRequest(
    @NotBlank String lineId,
    @NotBlank String itemType,
    @NotBlank String itemCode,
    String idempotencyKey,
    Boolean simulateFailure
) {}
