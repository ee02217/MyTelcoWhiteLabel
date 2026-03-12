package com.mytelco.customerbff.model;

public record LineUsageEntry(
    String lineId,
    String msisdn,
    String nickname,
    ServiceUsageBreakdown usage
) {}
