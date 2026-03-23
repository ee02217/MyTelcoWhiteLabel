package com.mytelco.customerbff;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.mytelco.customerbff.analytics.ProductAnalyticsService;
import com.mytelco.customerbff.config.SecurityConfig;
import com.mytelco.customerbff.controller.CustomerDashboardController;
import com.mytelco.customerbff.operator.OperatorContextResolver;
import com.mytelco.customerbff.security.CustomerIdentityResolver;
import com.mytelco.customerbff.service.CustomerAggregationService;
import com.mytelco.customerbff.family.controls.SharedControlService;
import io.micrometer.core.instrument.MeterRegistry;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(CustomerDashboardController.class)
@Import(SecurityConfig.class)
class CustomerBffSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CustomerAggregationService aggregationService;

    @MockBean
    private MeterRegistry meterRegistry;

    @MockBean
    private CustomerIdentityResolver customerIdentityResolver;

    @MockBean
    private OperatorContextResolver operatorContextResolver;

    @MockBean
    private ProductAnalyticsService productAnalyticsService;

    @MockBean
    private SharedControlService sharedControlService;

    @Test
    void dashboard_withNoAuthentication_shouldReturn401() throws Exception {
        mockMvc.perform(get("/api/v1/customer/dashboard"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void dashboard_withCustomerRole_shouldReturn200() throws Exception {
        mockMvc.perform(get("/api/v1/customer/dashboard"))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void dashboard_withAdminRole_shouldReturn403() throws Exception {
        mockMvc.perform(get("/api/v1/customer/dashboard"))
            .andExpect(status().isForbidden());
    }

    @Test
    void healthEndpoint_shouldBeUnauthenticated_whenNotExposedInWebMvcSlice() throws Exception {
        mockMvc.perform(get("/actuator/health"))
            .andExpect(status().isNotFound());
    }
}
