package com.mytelco.customerbff.model;

import java.math.BigDecimal;

public record BillPeriodComparison(
    BillPeriodSummary previous,
    BigDecimal deltaAbsolute,
    BigDecimal deltaPercentage
) {
}
