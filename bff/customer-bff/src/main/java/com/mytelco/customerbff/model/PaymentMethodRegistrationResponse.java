package com.mytelco.customerbff.model;

public record PaymentMethodRegistrationResponse(
    String paymentMethodId,
    String token,
    String status
) {}
