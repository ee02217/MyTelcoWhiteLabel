package com.mytelco.customerbff.model;

import java.util.List;

public record TroubleshootingFlow(
    String flowId,
    String issueType,
    String title,
    List<String> steps
) {
}
