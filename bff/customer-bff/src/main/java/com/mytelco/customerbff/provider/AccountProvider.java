package com.mytelco.customerbff.provider;

import com.mytelco.customerbff.model.AccountSummary;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

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
}
