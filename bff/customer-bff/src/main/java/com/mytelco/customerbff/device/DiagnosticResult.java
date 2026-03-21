package com.mytelco.customerbff.device;

public record DiagnosticResult(
    DiagnosticTestType testType,
    DiagnosticSeverity severity,
    String message,
    String nextStepGuidance,
    Object details
) {}
