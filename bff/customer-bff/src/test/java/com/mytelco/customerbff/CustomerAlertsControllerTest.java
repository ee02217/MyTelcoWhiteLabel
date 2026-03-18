package com.mytelco.customerbff;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mytelco.customerbff.controller.CustomerAlertsController;
import com.mytelco.customerbff.model.AlertInboxItem;
import com.mytelco.customerbff.model.AlertThresholdConfig;
import com.mytelco.customerbff.security.CustomerIdentityResolver;
import com.mytelco.customerbff.service.AlertInboxService;
import com.mytelco.customerbff.service.ThresholdConfigService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CustomerAlertsController.class)
class CustomerAlertsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ThresholdConfigService thresholdConfigService;

    @MockBean
    private AlertInboxService alertInboxService;

    @MockBean
    private CustomerIdentityResolver customerIdentityResolver;

    @Test
    @WithMockUser(username = "cust-1", roles = "CUSTOMER")
    void shouldGetThresholds() throws Exception {
        when(customerIdentityResolver.resolveCustomerId(any())).thenReturn("cust-1");
        when(thresholdConfigService.getConfig("cust-1"))
            .thenReturn(new AlertThresholdConfig("cust-1", List.of(80, 100), 360, Instant.now(), "system"));

        mockMvc.perform(get("/api/v1/customer/alerts/thresholds"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.thresholds[0]").value(80));
    }

    @Test
    @WithMockUser(username = "cust-1", roles = "CUSTOMER")
    void shouldUpdateThresholds() throws Exception {
        when(customerIdentityResolver.resolveCustomerId(any())).thenReturn("cust-1");
        when(thresholdConfigService.updateConfig(eq("cust-1"), anyList(), eq("cust-1")))
            .thenReturn(new AlertThresholdConfig("cust-1", List.of(85, 100), 360, Instant.now(), "cust-1"));

        mockMvc.perform(put("/api/v1/customer/alerts/thresholds")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(java.util.Map.of("thresholds", List.of(85, 100)))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.thresholds[0]").value(85));
    }

    @Test
    @WithMockUser(username = "cust-1", roles = "CUSTOMER")
    void shouldGetInbox() throws Exception {
        when(customerIdentityResolver.resolveCustomerId(any())).thenReturn("cust-1");
        when(alertInboxService.list("cust-1")).thenReturn(List.of(
            new AlertInboxItem("1", "cust-1", "LINE-001", "DATA", 80, 90, "IN_APP", "system", "crossed", Instant.now())
        ));

        mockMvc.perform(get("/api/v1/customer/alerts/inbox"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].lineId").value("LINE-001"));
    }
}
