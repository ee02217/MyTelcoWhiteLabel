package com.mytelco.customerbff;

import com.mytelco.customerbff.model.SupportCaseAttachment;
import com.mytelco.customerbff.model.SupportCaseCreateRequest;
import com.mytelco.customerbff.model.SupportCaseMessageRequest;
import com.mytelco.customerbff.model.SupportCaseResponse;
import com.mytelco.customerbff.service.SupportCaseService;
import com.mytelco.customerbff.service.SupportCaseSlaService;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class SupportCaseServiceTest {

    private final SupportCaseService service = new SupportCaseService(new SupportCaseSlaService());

    @Test
    void create_shouldStoreCategoryAndAttachmentMetadata_andComputeSla() {
        SupportCaseCreateRequest request = new SupportCaseCreateRequest(
            "BILLING",
            "Invoice discrepancy",
            "March invoice has an unexpected charge",
            "NORMAL",
            List.of(new SupportCaseAttachment("invoice.png", "image/png", 12345, "https://files.local/invoice.png"))
        );

        SupportCaseResponse created = service.create(request);

        assertThat(created.caseId()).startsWith("sc_");
        assertThat(created.category()).isEqualTo("BILLING");
        assertThat(created.attachments()).hasSize(1);
        assertThat(created.attachments().getFirst().fileName()).isEqualTo("invoice.png");
        assertThat(created.slaTarget()).isEqualTo("First response within 8h");
        assertThat(created.expectedResponseAt()).isAfter(created.createdAt());
    }

    @Test
    void timeline_shouldAppendMessages_andReturnOrderedEntries() {
        SupportCaseResponse created = service.create(new SupportCaseCreateRequest(
            "TECHNICAL",
            "No internet",
            "Internet drops every hour",
            "HIGH",
            List.of()
        ));

        service.addMessage(created.caseId(), new SupportCaseMessageRequest("customer-1", "CUSTOMER", "Issue started yesterday"));
        SupportCaseResponse updated = service.addMessage(created.caseId(), new SupportCaseMessageRequest("agent-7", "AGENT", "Investigating line profile"));

        assertThat(updated.timeline()).hasSize(3);
        assertThat(updated.timeline().get(0).type()).isEqualTo("CASE_CREATED");
        assertThat(updated.timeline().get(1).message()).isEqualTo("Issue started yesterday");
        assertThat(updated.timeline().get(2).message()).isEqualTo("Investigating line profile");
        assertThat(updated.timeline().get(0).timestamp())
            .isBeforeOrEqualTo(updated.timeline().get(1).timestamp());
        assertThat(updated.timeline().get(1).timestamp())
            .isBeforeOrEqualTo(updated.timeline().get(2).timestamp());
    }
}
