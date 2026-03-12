package com.mytelco.customerbff.model;

public record ServiceUsageBreakdown(
    long dataMb,
    int voiceMinutes,
    int smsCount
) {}
