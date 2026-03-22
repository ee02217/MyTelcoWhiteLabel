package com.mytelco.customerbff.billing;

public record AutoPayConfig(
    String customerId,
    boolean enabled,
    String paymentMethodId,
    String scheduleDay,
    String updatedAt
) {}
