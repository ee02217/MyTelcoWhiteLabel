package com.mytelco.customerbff.family.controls;

import java.time.Instant;

public record SharedControlCap(
    String lineId,
    SharedControlCategory category,
    double limit,
    String unit,
    Instant updatedAt
) {
}
