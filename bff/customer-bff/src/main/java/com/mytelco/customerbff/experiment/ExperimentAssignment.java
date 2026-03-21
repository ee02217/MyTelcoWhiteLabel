package com.mytelco.customerbff.experiment;

import java.util.Map;

public record ExperimentAssignment(
    String experimentId,
    String variant,
    Map<String, Object> config,
    long assignedAt
) {}
