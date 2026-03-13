package com.mytelco.customerbff.model;

import java.util.List;

public record TroubleshootingSessionResponse(
    String sessionId,
    String flowId,
    String issueType,
    TroubleshootingContext context,
    List<String> completedSteps,
    String outcome,
    String status
) {
}
