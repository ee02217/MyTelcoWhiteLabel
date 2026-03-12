package com.mytelco.customerbff.model;

import java.math.BigDecimal;
import java.util.List;

public record BillCategoryGroup(
    BillItemCategory category,
    List<BillLineItem> items,
    BigDecimal total
) {
}
