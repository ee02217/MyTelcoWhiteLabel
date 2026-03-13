package com.mytelco.customerbff.service;

import com.mytelco.customerbff.model.SupportCaseAttachment;
import com.mytelco.customerbff.model.SupportCaseCreateRequest;
import com.mytelco.customerbff.model.SupportCaseMessageRequest;
import com.mytelco.customerbff.model.SupportCaseResponse;
import com.mytelco.customerbff.model.SupportCaseStatus;
import com.mytelco.customerbff.model.SupportCaseTimelineEntry;
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

    private final SupportCaseSlaService slaService;
    private final Map<String, SupportCaseAggregate> casesById = new ConcurrentHashMap<>();

    public SupportCaseService(SupportCaseSlaService slaService) {
        this.slaService = slaService;
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

        SupportCaseAggregate aggregate = new SupportCaseAggregate(
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

        casesById.put(caseId, aggregate);
        return aggregate.toResponse();
    }

    public List<SupportCaseResponse> list() {
        return casesById.values().stream()
            .map(SupportCaseAggregate::toResponse)
            .sorted(Comparator.comparing(SupportCaseResponse::createdAt).reversed())
            .toList();
    }

    public SupportCaseResponse get(String caseId) {
        SupportCaseAggregate aggregate = casesById.get(caseId);
        return aggregate == null ? null : aggregate.toResponse();
    }

    public SupportCaseResponse addMessage(String caseId, SupportCaseMessageRequest request) {
        SupportCaseAggregate aggregate = casesById.get(caseId);
        if (aggregate == null) {
            return null;
        }

        Instant now = Instant.now();
        aggregate.timeline().add(new SupportCaseTimelineEntry(
            "evt_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12),
            now,
            request.actor(),
            request.actorType() == null || request.actorType().isBlank() ? "CUSTOMER" : request.actorType(),
            "MESSAGE",
            request.message()
        ));
        aggregate.updatedAt = now;
        return aggregate.toResponse();
    }

    private static final class SupportCaseAggregate {
        private final String caseId;
        private final String category;
        private final String subject;
        private final String description;
        private final String priority;
        private final SupportCaseStatus status;
        private final Instant createdAt;
        private Instant updatedAt;
        private final String slaTarget;
        private final Instant expectedResponseAt;
        private final List<SupportCaseAttachment> attachments;
        private final List<SupportCaseTimelineEntry> timeline;

        private SupportCaseAggregate(String caseId,
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
                                     List<SupportCaseTimelineEntry> timeline) {
            this.caseId = caseId;
            this.category = category;
            this.subject = subject;
            this.description = description;
            this.priority = priority;
            this.status = status;
            this.createdAt = createdAt;
            this.updatedAt = updatedAt;
            this.slaTarget = slaTarget;
            this.expectedResponseAt = expectedResponseAt;
            this.attachments = attachments;
            this.timeline = timeline;
        }

        private List<SupportCaseTimelineEntry> timeline() {
            return timeline;
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
