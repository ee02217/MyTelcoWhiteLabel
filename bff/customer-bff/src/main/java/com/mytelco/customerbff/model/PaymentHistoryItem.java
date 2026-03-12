package com.mytelco.customerbff.model;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record PaymentHistoryItem(
    String paymentId,
    OffsetDateTime paymentDate,
    BigDecimal amount,
    String currency,
    String methodSummary,
    String status,
    String referenceId
) {
}
