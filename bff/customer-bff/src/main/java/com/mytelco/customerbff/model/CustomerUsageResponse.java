package com.mytelco.customerbff.model;

import java.time.LocalDate;
import java.util.List;

public record CustomerUsageResponse(
    String view,
    LocalDate periodStart,
    LocalDate periodEnd,
    String customerId,
    ServiceUsageBreakdown totals,
    List<LineUsageEntry> lines,
    DataFreshness dataFreshness
) {}
