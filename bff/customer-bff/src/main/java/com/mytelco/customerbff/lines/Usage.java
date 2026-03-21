package com.mytelco.customerbff.lines;

public record Usage(
    String period,
    double dataUsedMb,
    double dataLimitMb,
    double voiceUsed,
    double voiceLimit,
    double smsUsed,
    double smsLimit
) {}
