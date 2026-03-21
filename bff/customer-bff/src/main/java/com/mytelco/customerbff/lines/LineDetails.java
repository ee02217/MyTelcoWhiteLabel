package com.mytelco.customerbff.lines;

import java.util.List;

public record LineDetails(
    String lineId,
    String phoneNumber,
    String status,
    String planName,
    double planPrice,
    String simType,
    String esimQrCode,
    String esimActivationCode,
    String activationDate,
    String ean13Code,
    String iccid,
    String deliveryStatus,
    String deliveryAddress,
    String estimatedDelivery,
    NumberPorting porting,
    List<Usage> usage
) {}
