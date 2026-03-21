package com.mytelco.customerbff.family.controls;

import java.time.Instant;

public record SharedControlAlert(
    String alertId,
    String lineId,
    SharedControlCategory category,
    SharedControlAlertLevel level,
    double consumed,
    double limit,
    String unit,
    Instant createdAt
) {
}
