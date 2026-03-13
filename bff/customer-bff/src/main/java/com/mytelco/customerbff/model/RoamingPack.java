package com.mytelco.customerbff.model;

import java.math.BigDecimal;

public record RoamingPack(
    String packId,
    String country,
    String name,
    int allowanceGb,
    int validityDays,
    BigDecimal price,
    String currency
) {}
