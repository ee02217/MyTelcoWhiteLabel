package com.mytelco.customerbff.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Account summary response model for customer dashboard.
 */
public record AccountSummary(
    String accountId,
    String accountStatus,
    String planName,
    LocalDateTime createdAt,
    String primaryMsisdn
) {}
