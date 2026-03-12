package com.mytelco.customerbff.provider;

import com.mytelco.customerbff.model.*;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

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

    public CustomerUsageResponse getUsageDetails(String customerId, UsageView view, String lineId) {
        List<LineUsageEntry> allLines = view == UsageView.BILLING_CYCLE ? billingCycleLines() : dailyLines();
        List<LineUsageEntry> filteredLines = lineId == null || lineId.isBlank()
            ? allLines
            : allLines.stream().filter(line -> line.lineId().equalsIgnoreCase(lineId)).toList();

        ServiceUsageBreakdown totals = new ServiceUsageBreakdown(
            filteredLines.stream().mapToLong(line -> line.usage().dataMb()).sum(),
            filteredLines.stream().mapToInt(line -> line.usage().voiceMinutes()).sum(),
            filteredLines.stream().mapToInt(line -> line.usage().smsCount()).sum()
        );

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate periodStart = view == UsageView.BILLING_CYCLE ? today.withDayOfMonth(1) : today;
        LocalDate periodEnd = view == UsageView.BILLING_CYCLE ? today : today;

        return new CustomerUsageResponse(
            view.apiValue(),
            periodStart,
            periodEnd,
            customerId,
            totals,
            filteredLines,
            new DataFreshness(Instant.now().minusSeconds(300), "Updated every 15 minutes (SLA <= 15m)")
        );
    }

    private List<LineUsageEntry> dailyLines() {
        return List.of(
            new LineUsageEntry("LINE-001", "+351910000001", "Primary", new ServiceUsageBreakdown(1250, 34, 8)),
            new LineUsageEntry("LINE-002", "+351910000002", "Family", new ServiceUsageBreakdown(820, 21, 5))
        );
    }

    private List<LineUsageEntry> billingCycleLines() {
        return List.of(
            new LineUsageEntry("LINE-001", "+351910000001", "Primary", new ServiceUsageBreakdown(7420, 322, 48)),
            new LineUsageEntry("LINE-002", "+351910000002", "Family", new ServiceUsageBreakdown(3960, 188, 34))
        );
    }
}
