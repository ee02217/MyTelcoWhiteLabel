package com.mytelco.customerbff;

import com.mytelco.customerbff.controller.CustomerDashboardController;
import com.mytelco.customerbff.model.AccountOverviewResponse;
import com.mytelco.customerbff.model.AccountSummary;
import com.mytelco.customerbff.model.ActiveLine;
import com.mytelco.customerbff.model.BillingSummary;
import com.mytelco.customerbff.model.CustomerDashboardResponse;
import com.mytelco.customerbff.model.CustomerUsageResponse;
import com.mytelco.customerbff.model.DataFreshness;
import com.mytelco.customerbff.model.LineStructure;
import com.mytelco.customerbff.model.LineUsageEntry;
import com.mytelco.customerbff.model.ServiceUsageBreakdown;
import com.mytelco.customerbff.model.UsageSummary;
import com.mytelco.customerbff.model.UsageThresholdCrossing;
import com.mytelco.customerbff.model.UsageView;
import com.mytelco.customerbff.family.controls.SharedControlService;
import com.mytelco.customerbff.operator.OperatorContextResolver;
import com.mytelco.customerbff.security.CustomerIdentityResolver;
import com.mytelco.customerbff.service.CustomerAggregationService;
import com.mytelco.customerbff.analytics.ProductAnalyticsService;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CustomerDashboardController.class)
@Import(CustomerDashboardControllerTest.MetricsTestConfig.class)
class CustomerDashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CustomerAggregationService aggregationService;

    @MockBean
    private CustomerIdentityResolver customerIdentityResolver;

    @MockBean
    private OperatorContextResolver operatorContextResolver;

    @MockBean
    private ProductAnalyticsService productAnalyticsService;

    @MockBean
    private SharedControlService sharedControlService;

    @Test
    @WithMockUser(username = "cust-1", roles = "CUSTOMER")
    void getDashboard_shouldReturnAggregatedData() throws Exception {
        var mockResponse = new CustomerDashboardResponse(
            new AccountSummary("ACC-123", "ACTIVE", "Premium", null, "+351123"),
            new UsageSummary(4500, 10000, 320, 1000, 45, 500, 45.0, 32.0, 9.0),
            new BillingSummary(new BigDecimal("29.99"), new BigDecimal("49.99"), null, null, "Credit Card", true),
            Instant.now()
        );

        when(customerIdentityResolver.resolveCustomerId(any())).thenReturn("cust-1");
        when(operatorContextResolver.resolveOperatorId(anyString())).thenReturn("operator-stub-pt");
        when(aggregationService.getDashboard("cust-1")).thenReturn(mockResponse);

        mockMvc.perform(get("/api/v1/customer/dashboard"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accountSummary.accountId").value("ACC-123"))
            .andExpect(jsonPath("$.usageSummary.dataUsedMb").value(4500))
            .andExpect(jsonPath("$.billingSummary.currentBalance").value(29.99));

        verify(productAnalyticsService, times(1)).trackLoginSuccess(
            anyString(),
            eq("operator-stub-pt"),
            eq("web"),
            anyString()
        );
    }

    @Test
    @WithMockUser(username = "cust-1", roles = "CUSTOMER")
    void getAccountOverview_shouldReturnMultiLinePayload() throws Exception {
        AccountOverviewResponse response = new AccountOverviewResponse(
            "Premium Unlimited",
            List.of(
                new ActiveLine("LINE-001", "+351910000001", "Primary", "ACTIVE"),
                new ActiveLine("LINE-002", "+351910000002", "Family", "ACTIVE")
            ),
            2,
            LocalDate.of(2026, 3, 20),
            new BigDecimal("24.99"),
            "POSTPAID",
            LineStructure.MULTI_LINE_READY
        );

        when(customerIdentityResolver.resolveCustomerId(any())).thenReturn("cust-1");
        when(operatorContextResolver.resolveOperatorId(anyString())).thenReturn("operator-stub-pt");
        when(aggregationService.getAccountOverview("cust-1")).thenReturn(response);

        mockMvc.perform(get("/api/v1/customer/account-overview"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.activeLineCount").value(2));

        verify(productAnalyticsService, times(1)).trackLoginSuccess(
            anyString(),
            eq("operator-stub-pt"),
            eq("web"),
            anyString()
        );
    }

    @Test
    @WithMockUser(username = "cust-1", roles = "CUSTOMER")
    void getUsageDetails_daily_shouldReturnThresholdCrossings() throws Exception {
        CustomerUsageResponse response = new CustomerUsageResponse(
            "daily",
            LocalDate.of(2026, 3, 12),
            LocalDate.of(2026, 3, 12),
            "cust-1",
            new ServiceUsageBreakdown(2070, 55, 13),
            List.of(new LineUsageEntry("LINE-001", "+351910000001", "Primary", new ServiceUsageBreakdown(9200, 34, 8))),
            List.of(new UsageThresholdCrossing("LINE-001", "DATA", 80, 92.0, Instant.parse("2026-03-12T12:00:00Z"))),
            new DataFreshness(Instant.parse("2026-03-12T11:55:00Z"), "Updated every 15 minutes (SLA <= 15m)")
        );

        when(customerIdentityResolver.resolveCustomerId(any())).thenReturn("cust-1");
        when(operatorContextResolver.resolveOperatorId(anyString())).thenReturn("operator-stub-pt");
        when(aggregationService.getUsageDetails("cust-1", UsageView.DAILY, null)).thenReturn(response);

        mockMvc.perform(get("/api/v1/customer/usage?view=daily"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.thresholdCrossings[0].thresholdPercent").value(80));

        verify(productAnalyticsService, times(1)).trackLoginSuccess(
            anyString(),
            eq("operator-stub-pt"),
            eq("web"),
            anyString()
        );
    }

    @TestConfiguration
    static class MetricsTestConfig {
        @Bean
        MeterRegistry meterRegistry() {
            return new SimpleMeterRegistry();
        }
    }
}
