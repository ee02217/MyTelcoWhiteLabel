package com.mytelco.customerbff;

import com.mytelco.customerbff.model.*;
import com.mytelco.customerbff.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class UsageThresholdAlertServiceTest {

    private ThresholdConfigService thresholdConfigService;
    private AlertDedupService dedupService;
    private AlertInboxService inboxService;
    private List<AlertInboxItem> pushed;
    private UsageThresholdAlertService service;

    @BeforeEach
    void setup() {
        thresholdConfigService = new ThresholdConfigService(360);
        dedupService = new AlertDedupService(360);
        inboxService = new AlertInboxService();
        pushed = new ArrayList<>();
        PushNotificationDispatcher dispatcher = pushed::add;
        service = new UsageThresholdAlertService(thresholdConfigService, dedupService, inboxService, dispatcher);
    }

    @Test
    void shouldTriggerCrossingsAtDefault80And100() {
        CustomerUsageResponse usage = usageWithMb(10_500);

        List<UsageThresholdCrossing> crossings = service.evaluateAndDispatch("12345", usage);

        assertEquals(2, crossings.size());
        assertEquals(List.of(80, 100), crossings.stream().map(UsageThresholdCrossing::thresholdPercent).sorted().toList());
        assertEquals(2, inboxService.list("12345").size());
        assertEquals(2, pushed.size());
    }

    @Test
    void shouldRespectConfigurableThresholds() {
        thresholdConfigService.updateConfig("12345", List.of(90), "customer");

        CustomerUsageResponse usage = usageWithMb(9_100);
        List<UsageThresholdCrossing> crossings = service.evaluateAndDispatch("12345", usage);

        assertEquals(1, crossings.size());
        assertEquals(90, crossings.get(0).thresholdPercent());
    }

    @Test
    void shouldDeduplicateRepeatedCrossingsInsideWindow() {
        CustomerUsageResponse usage = usageWithMb(10_500);

        List<UsageThresholdCrossing> first = service.evaluateAndDispatch("12345", usage);
        List<UsageThresholdCrossing> second = service.evaluateAndDispatch("12345", usage);

        assertEquals(2, first.size());
        assertEquals(0, second.size());
        assertEquals(2, inboxService.list("12345").size());
    }

    private CustomerUsageResponse usageWithMb(long dataMb) {
        return new CustomerUsageResponse(
            "billing-cycle",
            LocalDate.of(2026, 3, 1),
            LocalDate.of(2026, 3, 12),
            "12345",
            new ServiceUsageBreakdown(dataMb, 10, 2),
            List.of(new LineUsageEntry("LINE-001", "+351910000001", "Primary", new ServiceUsageBreakdown(dataMb, 10, 2))),
            List.of(),
            new DataFreshness(Instant.now(), "SLA")
        );
    }
}
