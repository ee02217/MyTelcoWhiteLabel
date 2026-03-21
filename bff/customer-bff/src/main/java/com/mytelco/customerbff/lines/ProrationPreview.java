package com.mytelco.customerbff.lines;

public record ProrationPreview(
    double creditForRemaining,
    double chargeForNewPlan,
    double totalDue,
    String effectiveDate,
    int daysRemaining
) {}
