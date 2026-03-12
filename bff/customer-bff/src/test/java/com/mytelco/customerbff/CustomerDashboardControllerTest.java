package com.mytelco.customerbff;

import com.mytelco.customerbff.controller.CustomerDashboardController;
import com.mytelco.customerbff.model.AccountOverviewResponse;
import com.mytelco.customerbff.model.ActiveLine;
import com.mytelco.customerbff.model.LineStructure;
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

    @TestConfiguration
    static class MetricsTestConfig {
        @Bean
        MeterRegistry meterRegistry() {
            return new SimpleMeterRegistry();
        }
    }
}
