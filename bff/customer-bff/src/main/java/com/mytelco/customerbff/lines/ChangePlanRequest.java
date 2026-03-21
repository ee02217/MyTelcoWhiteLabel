package com.mytelco.customerbff.lines;

public record ChangePlanRequest(
    String planId,
    String effectiveDate
) {}
