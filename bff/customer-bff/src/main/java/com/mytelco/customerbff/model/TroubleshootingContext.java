package com.mytelco.customerbff.model;

import java.time.Instant;

public record TroubleshootingContext(
    String lineId,
    String deviceInfo,
    String location,
    Instant timestamp
) {
}
