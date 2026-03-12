package com.mytelco.adminbff.configflags;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
    "admin.config.operators-path=../../platform-config/operators"
})
@AutoConfigureMockMvc
class OperatorConfigControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @WithMockUser(username = "qa-admin", roles = "ADMIN")
    void shouldResolveFlagsByOperatorAndChannel() throws Exception {
        mockMvc.perform(get("/api/v1/admin/config/flags/alpha-telecom/mobile"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.planChangeEnabled").value(false))
            .andExpect(jsonPath("$.addOnPurchaseEnabled").value(true));
    }

    @Test
    @WithMockUser(username = "qa-admin", roles = "ADMIN")
    void shouldReturnJourneyWithOrderedSteps() throws Exception {
        mockMvc.perform(get("/api/v1/admin/config/journeys/default/plan-change"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.journeyId").value("plan-change"))
            .andExpect(jsonPath("$.steps[0].order").value(1))
            .andExpect(jsonPath("$.steps[1].order").value(2));
    }

    @Test
    @WithMockUser(username = "platform-admin", roles = "ADMIN")
    void shouldAuditUpdatesAndIncrementVersion() throws Exception {
        mockMvc.perform(patch("/api/v1/admin/config/flags/default/web/retentionBannerEnabled")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"enabled\":true}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.actor").value("platform-admin"))
            .andExpect(jsonPath("$.version").isNumber())
            .andExpect(jsonPath("$.updatedAt").exists());

        mockMvc.perform(get("/api/v1/admin/config/flags/audit/default/web"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].actor").value("platform-admin"))
            .andExpect(jsonPath("$[0].timestamp").exists())
            .andExpect(jsonPath("$[0].version").isNumber())
            .andExpect(jsonPath("$[0].flagKey").value("retentionBannerEnabled"));
    }
}
