package com.mytelco.customerbff.provider;

import com.mytelco.customerbff.model.UsageSummary;
import org.springframework.stereotype.Component;

/**
 * Provider for usage-related data.
 * In production, this would call the billing/usage service.
 */
@Component
public class UsageProvider {

    /**
     * Retrieves usage summary for the given customer ID.
     */
    public UsageSummary getUsageSummary(String customerId) {
        // Stub implementation - in production, call actual usage service
        long dataUsed = 4500L;
        long dataLimit = 10000L;
        int voiceUsed = 320;
        int voiceLimit = 1000;
        int smsUsed = 45;
        int smsLimit = 500;

        return new UsageSummary(
            dataUsed,
            dataLimit,
            voiceUsed,
            voiceLimit,
            smsUsed,
            smsLimit,
            (double) dataUsed / dataLimit * 100,
            (double) voiceUsed / voiceLimit * 100,
            (double) smsUsed / smsLimit * 100
        );
    }
}
