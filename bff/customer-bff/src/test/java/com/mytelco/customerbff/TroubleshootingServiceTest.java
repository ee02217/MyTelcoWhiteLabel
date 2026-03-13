package com.mytelco.customerbff;

import com.mytelco.customerbff.model.TroubleshootingResolveRequest;
import com.mytelco.customerbff.model.TroubleshootingSessionStartRequest;
import com.mytelco.customerbff.model.TroubleshootingSessionStepRequest;
import com.mytelco.customerbff.service.TroubleshootingAnalyticsService;
import com.mytelco.customerbff.service.TroubleshootingService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TroubleshootingServiceTest {

    @Test
    void providesAtLeastFiveTroubleshootingFlows() {
        TroubleshootingService service = new TroubleshootingService(new TroubleshootingAnalyticsService());

        assertTrue(service.listFlows().size() >= 5);
    }

    @Test
    void startSessionPersistsLineDeviceLocationAndTimestamp() {
        TroubleshootingService service = new TroubleshootingService(new TroubleshootingAnalyticsService());

        var session = service.startSession(new TroubleshootingSessionStartRequest(
            "no-data",
            "line-40",
            "iPhone 15 iOS 18.1",
            "Lisbon/PT"
        ));

        assertEquals("line-40", session.context().lineId());
        assertEquals("iPhone 15 iOS 18.1", session.context().deviceInfo());
        assertEquals("Lisbon/PT", session.context().location());
        assertNotNull(session.context().timestamp());
    }

    @Test
    void resolveEmitsOutcomeAnalyticsEventWithContextMetadata() {
        TroubleshootingAnalyticsService analyticsService = new TroubleshootingAnalyticsService();
        TroubleshootingService service = new TroubleshootingService(analyticsService);

        var session = service.startSession(new TroubleshootingSessionStartRequest(
            "slow-speed",
            "line-41",
            "Pixel 9 Android 16",
            "Porto/PT"
        ));
        service.addStep(session.sessionId(), new TroubleshootingSessionStepRequest("signal-check", "2 bars"));
        var resolved = service.resolve(session.sessionId(), new TroubleshootingResolveRequest("resolved", "restart fixed"));

        assertEquals("RESOLVED", resolved.outcome());
        assertFalse(analyticsService.getOutcomeEvents().isEmpty());

        var event = analyticsService.getOutcomeEvents().get(0);
        assertEquals(session.sessionId(), event.sessionId());
        assertEquals("line-41", event.lineId());
        assertEquals("Pixel 9 Android 16", event.deviceInfo());
        assertEquals("Porto/PT", event.location());
        assertEquals("RESOLVED", event.outcome());
    }
}
