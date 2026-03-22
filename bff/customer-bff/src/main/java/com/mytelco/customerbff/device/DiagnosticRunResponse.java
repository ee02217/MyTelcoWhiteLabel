package com.mytelco.customerbff.device;

import java.time.Instant;
import java.util.List;

public record DiagnosticRunResponse(
    String lineId,
    List<DiagnosticResult> results,
    DiagnosticSeverity overallSeverity,
    boolean escalationRecommended,
    Instant completedAt
) {}
