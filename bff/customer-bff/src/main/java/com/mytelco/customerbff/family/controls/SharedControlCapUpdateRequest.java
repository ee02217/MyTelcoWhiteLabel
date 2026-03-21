package com.mytelco.customerbff.family.controls;

public record SharedControlCapUpdateRequest(
    SharedControlCategory category,
    double limit,
    String note
) {
}
