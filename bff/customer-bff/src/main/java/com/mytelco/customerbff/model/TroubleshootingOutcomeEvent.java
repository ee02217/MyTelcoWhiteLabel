package com.mytelco.customerbff.model;

import java.time.Instant;

public record TroubleshootingOutcomeEvent(
    String sessionId,
    String flowId,
    String issueType,
    String outcome,
    String lineId,
    String deviceInfo,
    String location,
    Instant timestamp
) {
}
