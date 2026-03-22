package com.mytelco.customerbff.device;

public record DeviceCompatibilityCheck(
    String lineId,
    boolean planCompatible,
    boolean roamingCompatible,
    String planMessage,
    String roamingMessage
) {}
