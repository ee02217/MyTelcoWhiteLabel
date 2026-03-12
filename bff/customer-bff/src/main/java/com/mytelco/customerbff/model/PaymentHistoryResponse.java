package com.mytelco.customerbff.model;

import java.util.List;

public record PaymentHistoryResponse(
    int months,
    List<PaymentHistoryItem> payments
) {
}
