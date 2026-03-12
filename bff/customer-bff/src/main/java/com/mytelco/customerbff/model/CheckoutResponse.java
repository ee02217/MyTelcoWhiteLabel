package com.mytelco.customerbff.model;

public record CheckoutResponse(
    String transactionId,
    String status,
    String message,
    String idempotencyKey
) {}
