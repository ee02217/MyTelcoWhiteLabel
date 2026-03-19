package com.mytelco.customerbff.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.mytelco.customerbff.model.SupportCaseAttachment;
import com.mytelco.customerbff.model.SupportCaseCreateRequest;
import com.mytelco.customerbff.model.SupportCaseMessageRequest;
import com.mytelco.customerbff.model.SupportCaseResponse;
import com.mytelco.customerbff.model.SupportCaseStatus;
import com.mytelco.customerbff.model.SupportCaseTimelineEntry;
import com.mytelco.customerbff.service.persistence.DurableStateStore;
import com.mytelco.customerbff.service.persistence.NoopDurableStateStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SupportCaseService {

    private static final String STATE_KEY = "support-case-state";
    private static final int SCHEMA_VERSION = 1;

    private final SupportCaseSlaService slaService;
    private final Map<String, SupportCaseRecord> casesById = new ConcurrentHashMap<>();
    private DurableStateStore durableStateStore = NoopDurableStateStore.INSTANCE;

    public SupportCaseService(SupportCaseSlaService slaService) {
        this.slaService = slaService;
    }

    @Autowired(required = false)
    public void setDurableStateStore(DurableStateStore durableStateStore) {
        this.durableStateStore = durableStateStore;
        loadState();
    }

    public SupportCaseResponse create(SupportCaseCreateRequest request) {
        Instant now = Instant.now();
        String caseId = "sc_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        String normalizedPriority = request.priority() == null || request.priority().isBlank() ? "NORMAL" : request.priority();

        List<SupportCaseAttachment> attachments = request.attachments() == null ? List.of() : List.copyOf(request.attachments());
        List<SupportCaseTimelineEntry> timeline = new ArrayList<>();
        timeline.add(new SupportCaseTimelineEntry(
            "evt_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12),
            now,
            "system",
            "SYSTEM",
            "CASE_CREATED",
            "Support case created"
        ));

        SupportCaseRecord supportCase = new SupportCaseRecord(
            caseId,
            request.category(),
            request.subject(),
            request.description(),
            normalizedPriority,
            SupportCaseStatus.OPEN,
            now,
            now,
            slaService.slaTargetFor(request.category(), normalizedPriority),
            slaService.expectedResponseAt(now, request.category(), normalizedPriority),
            attachments,
            timeline
        );

        casesById.put(caseId, supportCase);
        persistState();
        return supportCase.toResponse();
    }

    public List<SupportCaseResponse> list() {
        ensureSeedCases();
        return casesById.values().stream()
            .map(SupportCaseRecord::toResponse)
            .sorted(Comparator.comparing(SupportCaseResponse::createdAt).reversed())
            .toList();
    }

    public SupportCaseResponse get(String caseId) {
        SupportCaseRecord supportCase = casesById.get(caseId);
        return supportCase == null ? null : supportCase.toResponse();
    }

    public SupportCaseResponse addMessage(String caseId, SupportCaseMessageRequest request) {
        SupportCaseRecord supportCase = casesById.get(caseId);
        if (supportCase == null) {
            return null;
        }

        Instant now = Instant.now();
        List<SupportCaseTimelineEntry> timeline = new ArrayList<>(supportCase.timeline());
        timeline.add(new SupportCaseTimelineEntry(
            "evt_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12),
            now,
            request.actor(),
            request.actorType() == null || request.actorType().isBlank() ? "CUSTOMER" : request.actorType(),
            "MESSAGE",
            request.message()
        ));

        SupportCaseRecord updated = supportCase.withUpdatedTimeline(now, timeline);
        casesById.put(caseId, updated);
        persistState();
        return updated.toResponse();
    }

    private void ensureSeedCases() {
        if (!casesById.isEmpty()) {
            return;
        }

        Instant now = Instant.now();

        seedCase(
            "sc_seed_network_001",
            "TECHNICAL",
            "Intermittent network drops",
            "Data session drops were detected on line-web-1. Investigation in progress.",
            "HIGH",
            SupportCaseStatus.IN_PROGRESS,
            now.minusSeconds(3 * 24 * 60 * 60L),
            now.minusSeconds(2 * 60 * 60L),
            List.of(
                new SupportCaseTimelineEntry(
                    "evt_seed_tech_001",
                    now.minusSeconds(3 * 24 * 60 * 60L),
                    "system",
                    "SYSTEM",
                    "CASE_CREATED",
                    "Case opened from proactive monitoring alert"
                ),
                new SupportCaseTimelineEntry(
                    "evt_seed_tech_002",
                    now.minusSeconds(2 * 24 * 60 * 60L),
                    "support-agent",
                    "AGENT",
                    "MESSAGE",
                    "We are collecting diagnostics from the serving cell."
                )
            )
        );

        seedCase(
            "sc_seed_billing_001",
            "BILLING",
            "Invoice clarification requested",
            "Customer asked for clarification on invoice line items for last cycle.",
            "NORMAL",
            SupportCaseStatus.WAITING_CUSTOMER,
            now.minusSeconds(4 * 24 * 60 * 60L),
            now.minusSeconds(20 * 60 * 60L),
            List.of(
                new SupportCaseTimelineEntry(
                    "evt_seed_bill_001",
                    now.minusSeconds(4 * 24 * 60 * 60L),
                    "customer1",
                    "CUSTOMER",
                    "CASE_CREATED",
                    "Need a breakdown for the latest invoice."
                ),
                new SupportCaseTimelineEntry(
                    "evt_seed_bill_002",
                    now.minusSeconds(20 * 60 * 60L),
                    "billing-agent",
                    "AGENT",
                    "MESSAGE",
                    "Please confirm which charge category you need clarified."
                )
            )
        );

        persistState();
    }

    private void seedCase(
        String caseId,
        String category,
        String subject,
        String description,
        String priority,
        SupportCaseStatus status,
        Instant createdAt,
        Instant updatedAt,
        List<SupportCaseTimelineEntry> timeline
    ) {
        SupportCaseRecord seededCase = new SupportCaseRecord(
            caseId,
            category,
            subject,
            description,
            priority,
            status,
            createdAt,
            updatedAt,
            slaService.slaTargetFor(category, priority),
            slaService.expectedResponseAt(createdAt, category, priority),
            List.of(),
            timeline
        );
        casesById.put(caseId, seededCase);
    }

    private void loadState() {
        SupportCaseState state = durableStateStore.read(
            STATE_KEY,
            new TypeReference<>() {
            },
            SupportCaseState::empty
        );

        casesById.clear();
        casesById.putAll(state.casesById());
    }

    private void persistState() {
        durableStateStore.write(STATE_KEY, new SupportCaseState(SCHEMA_VERSION, Map.copyOf(casesById)));
    }

    private record SupportCaseState(int schemaVersion, Map<String, SupportCaseRecord> casesById) {
        private static SupportCaseState empty() {
            return new SupportCaseState(SCHEMA_VERSION, Map.of());
        }
    }

    private record SupportCaseRecord(
        String caseId,
        String category,
        String subject,
        String description,
        String priority,
        SupportCaseStatus status,
        Instant createdAt,
        Instant updatedAt,
        String slaTarget,
        Instant expectedResponseAt,
        List<SupportCaseAttachment> attachments,
        List<SupportCaseTimelineEntry> timeline
    ) {
        private SupportCaseRecord withUpdatedTimeline(Instant updatedAt, List<SupportCaseTimelineEntry> timeline) {
            return new SupportCaseRecord(
                caseId,
                category,
                subject,
                description,
                priority,
                status,
                createdAt,
                updatedAt,
                slaTarget,
                expectedResponseAt,
                List.copyOf(attachments),
                List.copyOf(timeline)
            );
        }

        private SupportCaseResponse toResponse() {
            return new SupportCaseResponse(
                caseId,
                category,
                subject,
                description,
                priority,
                status,
                createdAt,
                updatedAt,
                slaTarget,
                expectedResponseAt,
                List.copyOf(attachments),
                timeline.stream().sorted(Comparator.comparing(SupportCaseTimelineEntry::timestamp)).toList()
            );
        }
    }
}
