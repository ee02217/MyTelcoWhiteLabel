package com.mytelco.customerbff;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mytelco.customerbff.analytics.ProductAnalyticsService;
import com.mytelco.customerbff.controller.SupportCaseController;
import com.mytelco.customerbff.model.SupportCaseAttachment;
import com.mytelco.customerbff.model.SupportCaseCreateRequest;
import com.mytelco.customerbff.model.SupportCaseResponse;
import com.mytelco.customerbff.model.SupportCaseStatus;
import com.mytelco.customerbff.model.SupportCaseTimelineEntry;
import com.mytelco.customerbff.operator.OperatorContextResolver;
import com.mytelco.customerbff.security.CustomerIdentityResolver;
import com.mytelco.customerbff.service.SupportCaseService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SupportCaseController.class)
class SupportCaseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SupportCaseService supportCaseService;

    @MockBean
    private CustomerIdentityResolver customerIdentityResolver;

    @MockBean
    private OperatorContextResolver operatorContextResolver;

    @MockBean
    private ProductAnalyticsService productAnalyticsService;

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void create_shouldReturnContractWithSlaAndTimeline() throws Exception {
        SupportCaseCreateRequest request = new SupportCaseCreateRequest(
            "OUTAGE",
            "Network outage",
            "No signal in my area",
            "HIGH",
            List.of(new SupportCaseAttachment("evidence.jpg", "image/jpeg", 23456, null))
        );

        SupportCaseResponse response = new SupportCaseResponse(
            "sc_1",
            "OUTAGE",
            "Network outage",
            "No signal in my area",
            "HIGH",
            SupportCaseStatus.OPEN,
            Instant.parse("2026-03-13T08:00:00Z"),
            Instant.parse("2026-03-13T08:00:00Z"),
            "First response within 2h",
            Instant.parse("2026-03-13T10:00:00Z"),
            List.of(new SupportCaseAttachment("evidence.jpg", "image/jpeg", 23456, null)),
            List.of(new SupportCaseTimelineEntry("evt_1", Instant.parse("2026-03-13T08:00:00Z"), "system", "SYSTEM", "CASE_CREATED", "Support case created"))
        );

        when(customerIdentityResolver.resolveCustomerId(any())).thenReturn("cust-1");
        when(operatorContextResolver.resolveOperatorId(anyString())).thenReturn("operator-stub-pt");
        when(supportCaseService.create(any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/customer/support/cases")
                .with(csrf())
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.caseId").value("sc_1"))
            .andExpect(jsonPath("$.category").value("OUTAGE"))
            .andExpect(jsonPath("$.attachments[0].fileName").value("evidence.jpg"))
            .andExpect(jsonPath("$.slaTarget").value("First response within 2h"))
            .andExpect(jsonPath("$.expectedResponseAt").exists())
            .andExpect(jsonPath("$.timeline[0].type").value("CASE_CREATED"));

        verify(productAnalyticsService).trackSupportCaseCreated(
            eq("cust-1"),
            eq("operator-stub-pt"),
            eq("web"),
            anyString(),
            eq("sc_1"),
            eq("OUTAGE"),
            eq("HIGH")
        );
    }
}
