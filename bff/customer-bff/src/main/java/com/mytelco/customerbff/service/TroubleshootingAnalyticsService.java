package com.mytelco.customerbff.service;

import com.mytelco.customerbff.model.TroubleshootingOutcomeEvent;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class TroubleshootingAnalyticsService {

    private final CopyOnWriteArrayList<TroubleshootingOutcomeEvent> outcomeEvents = new CopyOnWriteArrayList<>();

    public void trackOutcome(TroubleshootingOutcomeEvent event) {
        outcomeEvents.add(event);
    }

    public List<TroubleshootingOutcomeEvent> getOutcomeEvents() {
        return List.copyOf(outcomeEvents);
    }
}
