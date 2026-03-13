package com.mytelco.customerbff.model;

import java.time.Instant;

public record CustomerOrderResponse(
    String orderId,
    String lineId,
    String itemType,
    String itemCode,
    String idempotencyKey,
    OrderState state,
    boolean rollbackApplied,
    String notificationMessage,
    Instant createdAt,
    Instant updatedAt
) {}
