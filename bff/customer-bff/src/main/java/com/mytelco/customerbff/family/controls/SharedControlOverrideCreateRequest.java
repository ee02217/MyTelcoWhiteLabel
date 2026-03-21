package com.mytelco.customerbff.family.controls;

public record SharedControlOverrideCreateRequest(
    String lineId,
    SharedControlCategory category,
    double requestedAmount,
    String reason
) {
}
