package com.mytelco.customerbff.lines;

public record Line(
    String lineId,
    String customerId,
    String phoneNumber,
    String status,
    String planId,
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
    String estimatedDelivery
) {}
