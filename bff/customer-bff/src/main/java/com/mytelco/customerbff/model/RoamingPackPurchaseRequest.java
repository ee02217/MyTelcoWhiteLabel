package com.mytelco.customerbff.model;

import jakarta.validation.constraints.NotBlank;

public record RoamingPackPurchaseRequest(
    @NotBlank String lineId,
    @NotBlank String country,
    @NotBlank String packId
) {}
