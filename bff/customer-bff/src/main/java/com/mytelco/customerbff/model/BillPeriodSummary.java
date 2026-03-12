package com.mytelco.customerbff.model;

import java.math.BigDecimal;

public record BillPeriodSummary(
    String period,
    BigDecimal grandTotal
) {
}
