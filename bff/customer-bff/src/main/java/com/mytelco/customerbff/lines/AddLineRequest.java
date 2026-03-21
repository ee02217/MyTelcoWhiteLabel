package com.mytelco.customerbff.lines;

public record AddLineRequest(
    String phoneNumber,
    String planId,
    String simType,
    String deliveryAddress
) {}
