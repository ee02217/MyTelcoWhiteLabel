package com.mytelco.customerbff.model;

import java.math.BigDecimal;

public record BillLineItem(
    String itemId,
    String description,
    BigDecimal amount,
    BillItemCategory category
) {
}
