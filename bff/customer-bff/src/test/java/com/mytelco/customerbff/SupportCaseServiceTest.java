package com.mytelco.customerbff;

import com.mytelco.customerbff.integration.casebff.CaseBffClient;
import com.mytelco.customerbff.model.SupportCaseCreateRequest;
import com.mytelco.customerbff.model.SupportCaseMessageRequest;
import com.mytelco.customerbff.model.SupportCaseResponse;
import com.mytelco.customerbff.model.SupportCaseStatus;
import com.mytelco.customerbff.service.SupportCaseService;
import com.mytelco.customerbff.service.SupportCaseSlaService;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class SupportCaseServiceTest {

    private final CaseBffClient caseBffClient = mock(CaseBffClient.class);
    private final SupportCaseSlaService slaService = new SupportCaseSlaService();
    private final SupportCaseService service = new SupportCaseService(caseBffClient, slaService);

    @Test
    void create_shouldMapExternalId_andComputeSlaTargetString() {
        Instant createdAt = Instant.parse("2026-03-22T21:39:04Z");
        Instant expectedResponseAt = Instant.parse("2026-03-23T01:39:04Z");

        CaseBffClient.TroubleTicketResponse ticketResponse = new CaseBffClient.TroubleTicketResponse(
            UUID.randomUUID(),
            "CASE-5AA81A50",
            "TECHNICAL",
            "Manual Test Ticket - Richard",
            "Created from test",
            "NORMAL",
            "OPEN",
            "customer-uuid",
            null,
            null,
            expectedResponseAt,
            null,
            createdAt,
            createdAt,
            List.of(new CaseBffClient.TroubleTicketEventResponse(
                UUID.randomUUID(),
                "CASE_CREATED",
                "system",
                "SYSTEM",
                "Support case created",
                createdAt
            ))
        );

        when(caseBffClient.create(anyString(), any())).thenReturn(ticketResponse);

        SupportCaseResponse created = service.create(
            "Bearer token",
            new SupportCaseCreateRequest("TECHNICAL", "Manual Test Ticket - Richard", "Created from test", "NORMAL", List.of())
        );

        assertThat(created.caseId()).isEqualTo("CASE-5AA81A50");
        assertThat(created.status()).isEqualTo(SupportCaseStatus.OPEN);
        assertThat(created.slaTarget()).isEqualTo("First response within 6h");
        assertThat(created.expectedResponseAt()).isEqualTo(expectedResponseAt);
        assertThat(created.attachments()).isEmpty();
        assertThat(created.timeline()).hasSize(1);
        assertThat(created.timeline().getFirst().type()).isEqualTo("CASE_CREATED");
    }

    @Test
    void addMessage_shouldMapTimelineEntries() {
        Instant createdAt = Instant.parse("2026-03-22T21:39:04Z");
        Instant updatedAt = Instant.parse("2026-03-22T21:40:00Z");

        CaseBffClient.TroubleTicketResponse ticketResponse = new CaseBffClient.TroubleTicketResponse(
            UUID.randomUUID(),
            "CASE-123",
            "BILLING",
            "Invoice question",
            "Need clarification",
            "NORMAL",
            "OPEN",
            "customer-uuid",
            null,
            null,
            createdAt.plusSeconds(4 * 3600),
            null,
            createdAt,
            updatedAt,
            List.of(
                new CaseBffClient.TroubleTicketEventResponse(UUID.randomUUID(), "CASE_CREATED", "system", "SYSTEM", "Support case created", createdAt),
                new CaseBffClient.TroubleTicketEventResponse(UUID.randomUUID(), "MESSAGE", "customer-uuid", "CUSTOMER", "Any update?", updatedAt)
            )
        );

        when(caseBffClient.addEvent(eq("Bearer token"), eq("CASE-123"), any())).thenReturn(ticketResponse);

        SupportCaseResponse updated = service.addMessage(
            "Bearer token",
            "CASE-123",
            new SupportCaseMessageRequest("customer-uuid", "CUSTOMER", "Any update?")
        );

        assertThat(updated.timeline()).hasSize(2);
        assertThat(updated.timeline().get(0).type()).isEqualTo("CASE_CREATED");
        assertThat(updated.timeline().get(1).type()).isEqualTo("MESSAGE");
        assertThat(updated.timeline().get(1).message()).isEqualTo("Any update?");
    }
}
