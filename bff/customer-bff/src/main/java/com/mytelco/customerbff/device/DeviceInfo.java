package com.mytelco.customerbff.device;

public record DeviceInfo(
    String lineId,
    String msisdn,
    String deviceModel,
    String imei,
    boolean esimCapable,
    String esimProfileStatus,
    String simStatus,
    String networkStatus,
    String lastUpdated
) {}
