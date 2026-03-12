package com.mytelco.customerbff.model;

public record PaymentRetryResponse(
    String paymentId,
    String status,
    String outcome,
    String idempotencyKey
) {
}
