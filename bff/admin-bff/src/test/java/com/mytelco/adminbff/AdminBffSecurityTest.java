package com.mytelco.adminbff;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.mytelco.adminbff.config.SecurityConfig;
import com.mytelco.adminbff.controller.AdminDashboardController;
import com.mytelco.adminbff.service.AdminAggregationService;
import io.micrometer.core.instrument.MeterRegistry;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AdminDashboardController.class)
@Import(SecurityConfig.class)
class AdminBffSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AdminAggregationService aggregationService;

    @MockBean
    private MeterRegistry meterRegistry;

    @Test
    void dashboard_withNoAuthentication_shouldReturn401() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void dashboard_withAdminRole_shouldReturn200() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard"))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "SUPPORT")
    void dashboard_withSupportRole_shouldReturn200() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard"))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void dashboard_withCustomerRole_shouldReturn403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard"))
            .andExpect(status().isForbidden());
    }

    @Test
    void healthEndpoint_shouldBeUnauthenticated_whenNotExposedInWebMvcSlice() throws Exception {
        mockMvc.perform(get("/actuator/health"))
            .andExpect(status().isNotFound());
    }
}
