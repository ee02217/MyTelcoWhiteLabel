package com.mytelco.customerbff.billing;

public record PaymentMethod(
    String paymentMethodId,
    String customerId,
    String type,
    String cardLast4,
    String cardBrand,
    String expiryMonth,
    String expiryYear,
    boolean isDefault,
    String createdAt
) {}
