package com.mytelco.customerbff.billing;

public record AddPaymentMethodRequest(
    String cardLast4,
    String cardBrand,
    String expiryMonth,
    String expiryYear,
    String cardHolder
) {}
