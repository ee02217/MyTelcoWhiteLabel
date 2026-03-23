package com.mytelco.customerbff.service;

import com.mytelco.customerbff.integration.casebff.CaseBffClient;
import com.mytelco.customerbff.model.SupportCaseCreateRequest;
import com.mytelco.customerbff.model.SupportCaseMessageRequest;
import com.mytelco.customerbff.model.SupportCaseResponse;
import com.mytelco.customerbff.model.SupportCaseStatus;
import com.mytelco.customerbff.model.SupportCaseTimelineEntry;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
public class SupportCaseService {

    private final CaseBffClient caseBffClient;
    private final SupportCaseSlaService slaService;

    public SupportCaseService(CaseBffClient caseBffClient, SupportCaseSlaService slaService) {
        this.caseBffClient = caseBffClient;
        this.slaService = slaService;
    }

    public SupportCaseResponse create(String authorizationHeader, SupportCaseCreateRequest request) {
        CaseBffClient.TroubleTicketCreateRequest createRequest = new CaseBffClient.TroubleTicketCreateRequest(
            request.category(),
            request.subject(),
            request.description(),
            normalizePriority(request.priority()),
            null
        );

        CaseBffClient.TroubleTicketResponse created = caseBffClient.create(authorizationHeader, createRequest);
        return toSupportCaseResponse(created);
    }

    public List<SupportCaseResponse> list(String authorizationHeader) {
        return caseBffClient.list(authorizationHeader)
            .stream()
            .map(this::toSupportCaseResponse)
            .sorted(Comparator.comparing(SupportCaseResponse::createdAt).reversed())
            .toList();
    }

    public SupportCaseResponse get(String authorizationHeader, String caseId) {
        CaseBffClient.TroubleTicketResponse ticket = caseBffClient.get(authorizationHeader, caseId);
        return ticket == null ? null : toSupportCaseResponse(ticket);
    }

    public SupportCaseResponse addMessage(String authorizationHeader, String caseId, SupportCaseMessageRequest request) {
        CaseBffClient.EventRequest eventRequest = new CaseBffClient.EventRequest(
            "MESSAGE",
            request.message()
        );

        CaseBffClient.TroubleTicketResponse updated = caseBffClient.addEvent(authorizationHeader, caseId, eventRequest);
        return updated == null ? null : toSupportCaseResponse(updated);
    }

    private SupportCaseResponse toSupportCaseResponse(CaseBffClient.TroubleTicketResponse ticket) {
        if (ticket == null) {
            return null;
        }

        List<SupportCaseTimelineEntry> timeline = ticket.timeline() == null
            ? List.of()
            : ticket.timeline().stream()
                .map(evt -> new SupportCaseTimelineEntry(
                    evt.id() == null ? null : evt.id().toString(),
                    evt.createdAt(),
                    evt.actor(),
                    evt.actorType(),
                    evt.eventType(),
                    evt.message()
                ))
                .sorted(Comparator.comparing(SupportCaseTimelineEntry::timestamp))
                .toList();

        Instant expectedResponseAt = ticket.expectedResponseAt();
        if (expectedResponseAt == null && ticket.createdAt() != null) {
            expectedResponseAt = slaService.expectedResponseAt(ticket.createdAt(), ticket.category(), ticket.priority());
        }

        String slaTarget = slaService.slaTargetFor(ticket.category(), ticket.priority());

        return new SupportCaseResponse(
            ticket.externalId(),
            ticket.category(),
            ticket.title(),
            ticket.description(),
            ticket.priority(),
            toStatus(ticket.status()),
            ticket.createdAt(),
            ticket.updatedAt(),
            slaTarget,
            expectedResponseAt,
            List.of(),
            timeline
        );
    }

    private SupportCaseStatus toStatus(String status) {
        if (status == null || status.isBlank()) {
            return SupportCaseStatus.OPEN;
        }

        try {
            return SupportCaseStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ignored) {
            return SupportCaseStatus.OPEN;
        }
    }

    private String normalizePriority(String priority) {
        if (priority == null || priority.isBlank()) {
            return "NORMAL";
        }
        return priority.trim().toUpperCase(Locale.ROOT);
    }
}
