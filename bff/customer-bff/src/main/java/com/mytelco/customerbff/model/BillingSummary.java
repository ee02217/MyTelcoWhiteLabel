package com.mytelco.customerbff.model;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Billing summary response model for customer dashboard.
 */
public record BillingSummary(
    BigDecimal currentBalance,
    BigDecimal lastPaymentAmount,
    LocalDate lastPaymentDate,
    LocalDate nextPaymentDueDate,
    String paymentMethod,
    boolean autoPayEnabled
) {}
