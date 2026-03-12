package com.mytelco.customerbff.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Account overview payload for customer dashboard surface.
 */
public record AccountOverviewResponse(
    String plan,
    List<ActiveLine> activeLines,
    int activeLineCount,
    LocalDate nextBillDate,
    BigDecimal outstandingAmount,
    String accountType,
    LineStructure lineStructure
) {}
