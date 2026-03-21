package com.mytelco.customerbff.travel;

public record RoamingUsage(
    String lineId,
    String country,
    long dataUsedMb,
    int voiceUsedMinutes,
    int smsUsed,
    long dataLimitMb,
    int voiceLimitMinutes,
    String periodStart,
    String periodEnd
) {}
