package com.mytelco.customerbff.service;

import com.mytelco.customerbff.model.*;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class UsageThresholdAlertService {

    private static final String SERVICE = "DATA";
    private static final double LINE_DATA_ALLOWANCE_MB = 10_000.0;

    private final ThresholdConfigService thresholdConfigService;
    private final AlertDedupService dedupService;
    private final AlertInboxService inboxService;
    private final PushNotificationDispatcher pushDispatcher;

    public UsageThresholdAlertService(
        ThresholdConfigService thresholdConfigService,
        AlertDedupService dedupService,
        AlertInboxService inboxService,
        PushNotificationDispatcher pushDispatcher
    ) {
        this.thresholdConfigService = thresholdConfigService;
        this.dedupService = dedupService;
        this.inboxService = inboxService;
        this.pushDispatcher = pushDispatcher;
    }

    public List<UsageThresholdCrossing> evaluateAndDispatch(String customerId, CustomerUsageResponse usageResponse) {
        AlertThresholdConfig config = thresholdConfigService.getConfig(customerId);
        List<UsageThresholdCrossing> crossings = new ArrayList<>();

        for (LineUsageEntry line : usageResponse.lines()) {
            double currentPercent = (line.usage().dataMb() / LINE_DATA_ALLOWANCE_MB) * 100.0;

            for (Integer threshold : config.thresholds()) {
                if (currentPercent >= threshold && dedupService.shouldSend(customerId, line.lineId(), SERVICE, threshold)) {
                    UsageThresholdCrossing crossing = new UsageThresholdCrossing(
                        line.lineId(),
                        SERVICE,
                        threshold,
                        currentPercent,
                        Instant.now()
                    );
                    crossings.add(crossing);

                    AlertInboxItem inAppNotification = new AlertInboxItem(
                        UUID.randomUUID().toString(),
                        customerId,
                        line.lineId(),
                        SERVICE,
                        threshold,
                        currentPercent,
                        "IN_APP",
                        "system",
                        String.format("Line %s crossed %d%% data usage (current %.1f%%)", line.nickname(), threshold, currentPercent),
                        crossing.crossedAt()
                    );

                    inboxService.add(customerId, inAppNotification);
                    pushDispatcher.dispatch(new AlertInboxItem(
                        UUID.randomUUID().toString(),
                        customerId,
                        line.lineId(),
                        SERVICE,
                        threshold,
                        currentPercent,
                        "PUSH",
                        "system",
                        inAppNotification.message(),
                        crossing.crossedAt()
                    ));
                }
            }
        }

        return crossings;
    }
}
