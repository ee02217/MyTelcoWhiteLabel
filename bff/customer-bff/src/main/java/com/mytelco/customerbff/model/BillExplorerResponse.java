package com.mytelco.customerbff.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public record BillExplorerResponse(
    String customerId,
    String period,
    LocalDate periodStart,
    LocalDate periodEnd,
    List<BillCategoryGroup> groupedLineItems,
    Map<BillItemCategory, BigDecimal> totalsByCategory,
    BigDecimal grandTotal,
    BillPeriodComparison comparison,
    InvoiceMetadata invoice
) {
}
