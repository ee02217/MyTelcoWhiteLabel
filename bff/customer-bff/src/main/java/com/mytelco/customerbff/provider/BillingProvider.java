package com.mytelco.customerbff.provider;

import com.mytelco.customerbff.model.BillingSummary;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Provider for billing-related data.
 * In production, this would call the billing service.
 */
@Component
public class BillingProvider {

    /**
     * Retrieves billing summary for the given customer ID.
     */
    public BillingSummary getBillingSummary(String customerId) {
        // Stub implementation - in production, call actual billing service
        return new BillingSummary(
            new BigDecimal("29.99"),
            new BigDecimal("49.99"),
            LocalDate.now().minusDays(15),
            LocalDate.now().plusDays(15),
            "Credit Card",
            true
        );
    }
}
