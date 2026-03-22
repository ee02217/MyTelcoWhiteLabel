package com.mytelco.customerbff.service.status;

public record RegionStatus(
    String regionCode,
    String regionName,
    ServiceType serviceType,
    String status,
    String lastUpdated
) {}
