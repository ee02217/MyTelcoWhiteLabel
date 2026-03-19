package com.mytelco.customerbff.operator;

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
 * Reference adapter implementation used for docker/local runtime.
 */
@Component
public class StubPortugalOperatorAdapter implements OperatorAdapter {

    private static final String OPERATOR_ID = "operator-stub-pt";
    private static final List<String> SUPPORTED_OPERATOR_IDS = List.of(OPERATOR_ID, "stub", "default");

    @Override
    public String adapterId() {
        return "stub-portugal-adapter";
    }

    @Override
    public boolean supportsOperator(String operatorId) {
        if (operatorId == null || operatorId.isBlank()) {
            return false;
        }
        return SUPPORTED_OPERATOR_IDS.stream().anyMatch(candidate -> candidate.equalsIgnoreCase(operatorId));
    }

    @Override
    public AccountSummary getAccountSummary(String customerId) {
        return new AccountSummary(
            "ACC-" + customerId,
            "ACTIVE",
            "Premium Unlimited",
            LocalDateTime.now().minusMonths(6),
            "+351" + customerId
        );
    }

    @Override
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

    @Override
    public UsageSummary getUsageSummary(String customerId) {
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

    @Override
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
        LocalDate periodEnd = today;

        return new CustomerUsageResponse(
            view.apiValue(),
            periodStart,
            periodEnd,
            customerId,
            totals,
            filteredLines,
            List.of(),
            new DataFreshness(Instant.now().minusSeconds(300), "Updated every 15 minutes (SLA <= 15m)")
        );
    }

    @Override
    public BillingSummary getBillingSummary(String customerId) {
        return new BillingSummary(
            new BigDecimal("29.99"),
            new BigDecimal("49.99"),
            LocalDate.now().minusDays(15),
            LocalDate.now().plusDays(15),
            "Credit Card",
            true
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
