package com.mytelco.customerbff.model;

import java.time.LocalDate;

public record RoamingPackPurchaseResponse(
    String lineId,
    String country,
    String packId,
    int updatedAllowanceGb,
    LocalDate validFrom,
    LocalDate validUntil,
    String status
) {}
