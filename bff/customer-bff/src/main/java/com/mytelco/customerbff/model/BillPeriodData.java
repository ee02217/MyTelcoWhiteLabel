package com.mytelco.customerbff.model;

import java.time.LocalDate;
import java.util.List;

public record BillPeriodData(
    String period,
    LocalDate periodStart,
    LocalDate periodEnd,
    List<BillLineItem> lineItems,
    InvoiceMetadata invoice
) {
}
