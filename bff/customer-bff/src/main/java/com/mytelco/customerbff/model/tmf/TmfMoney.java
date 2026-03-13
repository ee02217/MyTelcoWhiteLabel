package com.mytelco.customerbff.model.tmf;

import java.math.BigDecimal;

public record TmfMoney(
    BigDecimal taxIncludedAmount,
    String unit
) {}
