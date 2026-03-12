package com.mytelco.customerbff;

import com.mytelco.customerbff.controller.CustomerDashboardController;
import com.mytelco.customerbff.model.*;
import com.mytelco.customerbff.service.CustomerAggregationService;
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

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Basic unit tests for CustomerDashboardController.
 */
@WebMvcTest(CustomerDashboardController.class)
@Import(CustomerDashboardControllerTest.MetricsTestConfig.class)
class CustomerDashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CustomerAggregationService aggregationService;

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void getDashboard_shouldReturnAggregatedData() throws Exception {
        var mockResponse = new com.mytelco.customerbff.model.CustomerDashboardResponse(
            new com.mytelco.customerbff.model.AccountSummary("ACC-123", "ACTIVE", "Premium", null, "+351123"),
            new com.mytelco.customerbff.model.UsageSummary(4500, 10000, 320, 1000, 45, 500, 45.0, 32.0, 9.0),
            new com.mytelco.customerbff.model.BillingSummary(new java.math.BigDecimal("29.99"), new java.math.BigDecimal("49.99"), null, null, "Credit Card", true),
            Instant.now()
        );

        when(aggregationService.getDashboard("12345")).thenReturn(mockResponse);

        mockMvc.perform(get("/api/v1/customer/dashboard"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accountSummary.accountId").value("ACC-123"))
            .andExpect(jsonPath("$.usageSummary.dataUsedMb").value(4500))
            .andExpect(jsonPath("$.billingSummary.currentBalance").value(29.99));
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void getDashboardByCustomerId_shouldReturnDataForSpecificCustomer() throws Exception {
        var mockResponse = new com.mytelco.customerbff.model.CustomerDashboardResponse(
            new com.mytelco.customerbff.model.AccountSummary("ACC-999", "ACTIVE", "Basic", null, "+351999"),
            new com.mytelco.customerbff.model.UsageSummary(1000, 5000, 50, 500, 10, 100, 20.0, 10.0, 10.0),
            new com.mytelco.customerbff.model.BillingSummary(new java.math.BigDecimal("19.99"), new java.math.BigDecimal("19.99"), null, null, "Debit Card", false),
            Instant.now()
        );

        when(aggregationService.getDashboard("999")).thenReturn(mockResponse);

        mockMvc.perform(get("/api/v1/customer/999/dashboard"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accountSummary.accountId").value("ACC-999"));
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
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

        when(aggregationService.getAccountOverview("12345")).thenReturn(response);

        mockMvc.perform(get("/api/v1/customer/account-overview"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.plan").value("Premium Unlimited"))
            .andExpect(jsonPath("$.activeLineCount").value(2))
            .andExpect(jsonPath("$.activeLines[1].msisdn").value("+351910000002"))
            .andExpect(jsonPath("$.nextBillDate").value("2026-03-20"))
            .andExpect(jsonPath("$.outstandingAmount").value(24.99))
            .andExpect(jsonPath("$.lineStructure").value("MULTI_LINE_READY"));
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void getUsageDetails_daily_shouldReturnPerLineAndServiceBreakdown() throws Exception {
        CustomerUsageResponse response = new CustomerUsageResponse(
            "daily",
            LocalDate.of(2026, 3, 12),
            LocalDate.of(2026, 3, 12),
            "12345",
            new ServiceUsageBreakdown(2070, 55, 13),
            List.of(
                new LineUsageEntry("LINE-001", "+351910000001", "Primary", new ServiceUsageBreakdown(1250, 34, 8)),
                new LineUsageEntry("LINE-002", "+351910000002", "Family", new ServiceUsageBreakdown(820, 21, 5))
            ),
            new DataFreshness(Instant.parse("2026-03-12T11:55:00Z"), "Updated every 15 minutes (SLA <= 15m)")
        );

        when(aggregationService.getUsageDetails("12345", UsageView.DAILY, null)).thenReturn(response);

        mockMvc.perform(get("/api/v1/customer/usage?view=daily"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.view").value("daily"))
            .andExpect(jsonPath("$.totals.dataMb").value(2070))
            .andExpect(jsonPath("$.lines[0].lineId").value("LINE-001"))
            .andExpect(jsonPath("$.lines[0].usage.voiceMinutes").value(34))
            .andExpect(jsonPath("$.lines[1].usage.smsCount").value(5))
            .andExpect(jsonPath("$.dataFreshness.asOf").exists())
            .andExpect(jsonPath("$.dataFreshness.sla").value("Updated every 15 minutes (SLA <= 15m)"));
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void getUsageDetails_billingCycle_shouldSupportViewSwitchAndLineFilter() throws Exception {
        CustomerUsageResponse response = new CustomerUsageResponse(
            "billing-cycle",
            LocalDate.of(2026, 3, 1),
            LocalDate.of(2026, 3, 12),
            "12345",
            new ServiceUsageBreakdown(7420, 322, 48),
            List.of(
                new LineUsageEntry("LINE-001", "+351910000001", "Primary", new ServiceUsageBreakdown(7420, 322, 48))
            ),
            new DataFreshness(Instant.parse("2026-03-12T11:55:00Z"), "Updated every 15 minutes (SLA <= 15m)")
        );

        when(aggregationService.getUsageDetails("12345", UsageView.BILLING_CYCLE, "LINE-001")).thenReturn(response);

        mockMvc.perform(get("/api/v1/customer/usage?view=billing-cycle&lineId=LINE-001"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.view").value("billing-cycle"))
            .andExpect(jsonPath("$.lines.length()").value(1))
            .andExpect(jsonPath("$.lines[0].lineId").value("LINE-001"))
            .andExpect(jsonPath("$.totals.voiceMinutes").value(322))
            .andExpect(jsonPath("$.dataFreshness.sla").exists());
    }

    @TestConfiguration
    static class MetricsTestConfig {
        @Bean
        MeterRegistry meterRegistry() {
            return new SimpleMeterRegistry();
        }
    }
}
