package com.mytelco.customerbff.service;

import com.mytelco.customerbff.model.TroubleshootingContext;
import com.mytelco.customerbff.model.TroubleshootingFlow;
import com.mytelco.customerbff.model.TroubleshootingOutcomeEvent;
import com.mytelco.customerbff.model.TroubleshootingResolveRequest;
import com.mytelco.customerbff.model.TroubleshootingSessionResponse;
import com.mytelco.customerbff.model.TroubleshootingSessionStartRequest;
import com.mytelco.customerbff.model.TroubleshootingSessionStepRequest;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TroubleshootingService {

    private final TroubleshootingAnalyticsService analyticsService;
    private final List<TroubleshootingFlow> flows;
    private final Map<String, SessionState> sessionStore = new ConcurrentHashMap<>();

    public TroubleshootingService(TroubleshootingAnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
        this.flows = List.of(
            new TroubleshootingFlow("no-data", "NO_DATA", "No mobile data", List.of("airplane-mode-check", "apn-check", "network-reset")),
            new TroubleshootingFlow("slow-speed", "SLOW_SPEED", "Slow internet speed", List.of("signal-check", "background-apps-check", "speed-test")),
            new TroubleshootingFlow("no-calls", "NO_CALLS", "Cannot make or receive calls", List.of("volte-check", "call-forwarding-check", "network-registration-check")),
            new TroubleshootingFlow("no-sms", "NO_SMS", "SMS not sending or receiving", List.of("sms-center-check", "message-app-reset", "network-registration-check")),
            new TroubleshootingFlow("roaming-issues", "ROAMING_ISSUES", "Roaming not working", List.of("roaming-toggle-check", "network-selection-check", "roaming-pack-check"))
        );
    }

    public List<TroubleshootingFlow> listFlows() {
        return flows;
    }

    public TroubleshootingSessionResponse startSession(TroubleshootingSessionStartRequest request) {
        TroubleshootingFlow flow = flowById(request.flowId());
        String sessionId = UUID.randomUUID().toString();
        TroubleshootingContext context = new TroubleshootingContext(
            request.lineId(),
            request.deviceInfo(),
            request.location(),
            Instant.now()
        );

        SessionState state = new SessionState(
            sessionId,
            flow.flowId(),
            flow.issueType(),
            context,
            new ArrayList<>(),
            null,
            "IN_PROGRESS"
        );

        sessionStore.put(sessionId, state);
        return state.toResponse();
    }

    public TroubleshootingSessionResponse addStep(String sessionId, TroubleshootingSessionStepRequest request) {
        SessionState state = sessionById(sessionId);
        state.completedSteps.add(request.stepId());
        return state.toResponse();
    }

    public TroubleshootingSessionResponse resolve(String sessionId, TroubleshootingResolveRequest request) {
        SessionState state = sessionById(sessionId);
        String outcome = normalizeOutcome(request.outcome());
        state.outcome = outcome;
        state.status = "RESOLVED";

        analyticsService.trackOutcome(new TroubleshootingOutcomeEvent(
            state.sessionId,
            state.flowId,
            state.issueType,
            outcome,
            state.context.lineId(),
            state.context.deviceInfo(),
            state.context.location(),
            state.context.timestamp()
        ));

        return state.toResponse();
    }

    private TroubleshootingFlow flowById(String flowId) {
        return flows.stream()
            .filter(flow -> flow.flowId().equals(flowId))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Unknown troubleshooting flow: " + flowId));
    }

    private SessionState sessionById(String sessionId) {
        SessionState state = sessionStore.get(sessionId);
        if (state == null) {
            throw new IllegalArgumentException("Unknown troubleshooting session: " + sessionId);
        }
        return state;
    }

    private String normalizeOutcome(String rawOutcome) {
        String outcome = rawOutcome.toUpperCase(Locale.ROOT);
        if (!List.of("RESOLVED", "ESCALATED", "UNRESOLVED").contains(outcome)) {
            throw new IllegalArgumentException("Unsupported outcome: " + rawOutcome);
        }
        return outcome;
    }

    private static final class SessionState {
        private final String sessionId;
        private final String flowId;
        private final String issueType;
        private final TroubleshootingContext context;
        private final List<String> completedSteps;
        private String outcome;
        private String status;

        private SessionState(String sessionId,
                             String flowId,
                             String issueType,
                             TroubleshootingContext context,
                             List<String> completedSteps,
                             String outcome,
                             String status) {
            this.sessionId = sessionId;
            this.flowId = flowId;
            this.issueType = issueType;
            this.context = context;
            this.completedSteps = completedSteps;
            this.outcome = outcome;
            this.status = status;
        }

        private TroubleshootingSessionResponse toResponse() {
            return new TroubleshootingSessionResponse(sessionId, flowId, issueType, context, List.copyOf(completedSteps), outcome, status);
        }
    }
}
