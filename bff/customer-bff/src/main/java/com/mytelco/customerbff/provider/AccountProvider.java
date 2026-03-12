package com.mytelco.customerbff.provider;

import com.mytelco.customerbff.model.AccountOverviewResponse;
import com.mytelco.customerbff.model.AccountSummary;
import com.mytelco.customerbff.model.ActiveLine;
import com.mytelco.customerbff.model.LineStructure;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Provider for account-related data.
 * In production, this would call the account management service.
 */
@Component
public class AccountProvider {

    /**
     * Retrieves account summary for the given customer ID.
     */
    public AccountSummary getAccountSummary(String customerId) {
        // Stub implementation - in production, call actual account service
        return new AccountSummary(
            "ACC-" + customerId,
            "ACTIVE",
            "Premium Unlimited",
            LocalDateTime.now().minusMonths(6),
            "+351" + customerId
        );
    }

    /**
     * Retrieves account overview required for F-05.1 account dashboard.
     */
    public AccountOverviewResponse getAccountOverview(String customerId) {
        List<ActiveLine> lines = List.of(
            new ActiveLine("LINE-001", "+351910000001", "Primary", "ACTIVE"),
            new ActiveLine("LINE-002", "+351910000002", "Family", "ACTIVE")
        );

        LineStructure lineStructure = lines.size() > 1
            ? LineStructure.MULTI_LINE_READY
            : LineStructure.SINGLE_LINE;

        return new AccountOverviewResponse(
            "Premium Unlimited",
            lines,
            lines.size(),
            LocalDate.now().plusDays(12),
            new BigDecimal("24.99"),
            "POSTPAID",
            lineStructure
        );
    }
}
