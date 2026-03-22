package com.mytelco.customerbff.mock;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

import org.springframework.stereotype.Component;

import com.mytelco.customerbff.model.AccountOverviewResponse;
import com.mytelco.customerbff.model.AccountSummary;
import com.mytelco.customerbff.model.ActiveLine;
import com.mytelco.customerbff.model.BillingSummary;
import com.mytelco.customerbff.model.CustomerUsageResponse;
import com.mytelco.customerbff.model.DataFreshness;
import com.mytelco.customerbff.model.LineStructure;
import com.mytelco.customerbff.model.LineUsageEntry;
import com.mytelco.customerbff.model.ServiceUsageBreakdown;
import com.mytelco.customerbff.model.UsageSummary;
import com.mytelco.customerbff.model.UsageView;

/**
 * Provides mock customer data for demo/development purposes.
 * Only active when Spring profile "mock" is enabled.
 */
@Component
public class MockCustomerDataProvider {

    /**
     * Get mock account summary.
     */
    public AccountSummary getAccountSummary(String customerId) {
        return new AccountSummary(
            "ACC-" + customerId,
            "ACTIVE",
            "Premium Unlimited Plan",
            LocalDateTime.now().minusMonths(8),
            "+351910000001"
        );
    }

    /**
     * Get mock account overview.
     */
    public AccountOverviewResponse getAccountOverview(String customerId) {
        List<ActiveLine> lines = List.of(
            new ActiveLine("LINE-001", "+351910000001", "Primary", "ACTIVE"),
            new ActiveLine("LINE-002", "+351910000002", "Secondary", "ACTIVE")
        );

        return new AccountOverviewResponse(
            "Premium Unlimited Plan",
            lines,
            lines.size(),
            LocalDate.now().plusDays(15),
            new BigDecimal("29.99"),
            "POSTPAID",
            LineStructure.MULTI_LINE_READY
        );
    }

    /**
     * Get mock usage summary.
     */
    public UsageSummary getUsageSummary(String customerId) {
        long dataUsed = 7500L;
        long dataLimit = 10000L;
        int voiceUsed = 450;
        int voiceLimit = 1000;
        int smsUsed = 78;
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

    /**
     * Get mock usage details.
     */
    public CustomerUsageResponse getUsageDetails(String customerId, UsageView view, String lineId) {
        List<LineUsageEntry> lines = List.of(
            new LineUsageEntry("LINE-001", "+351910000001", "Primary", 
                new ServiceUsageBreakdown(5200, 320, 52)),
            new LineUsageEntry("LINE-002", "+351910000002", "Secondary", 
                new ServiceUsageBreakdown(2300, 130, 26))
        );

        ServiceUsageBreakdown totals = new ServiceUsageBreakdown(
            lines.stream().mapToLong(l -> l.usage().dataMb()).sum(),
            lines.stream().mapToInt(l -> l.usage().voiceMinutes()).sum(),
            lines.stream().mapToInt(l -> l.usage().smsCount()).sum()
        );

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate periodStart = view == UsageView.BILLING_CYCLE ? today.withDayOfMonth(1) : today.minusDays(7);
        LocalDate periodEnd = today;

        return new CustomerUsageResponse(
            view.apiValue(),
            periodStart,
            periodEnd,
            customerId,
            totals,
            lines,
            List.of(),
            new DataFreshness(Instant.now().minusSeconds(120), "Updated every 15 minutes")
        );
    }

    /**
     * Get mock billing summary.
     */
    public BillingSummary getBillingSummary(String customerId) {
        return new BillingSummary(
            new BigDecimal("12.50"),        // current balance
            new BigDecimal("29.99"),        // outstanding
            LocalDate.now().minusDays(12),  // last payment
            LocalDate.now().plusDays(18),   // next payment due
            "Visa •••• 4242",               // payment method
            true                            // auto-pay enabled
        );
    }
}
