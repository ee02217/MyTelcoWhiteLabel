package com.mytelco.customerbff.family.controls;

public record SharedControlUsage(
    String lineId,
    SharedControlCategory category,
    double consumed,
    double limit,
    String unit,
    double usageRatio
) {
}
