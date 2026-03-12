package com.mytelco.customerbff;

import com.mytelco.customerbff.controller.CustomerDashboardController;
import com.mytelco.customerbff.service.CustomerAggregationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Basic unit tests for CustomerDashboardController.
 */
@WebMvcTest(CustomerDashboardController.class)
class CustomerDashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CustomerAggregationService aggregationService;

    @Test
    void getDashboard_shouldReturnAggregatedData() throws Exception {
        // Arrange
        var mockResponse = new com.mytelco.customerbff.model.CustomerDashboardResponse(
            new com.mytelco.customerbff.model.AccountSummary(\"ACC-123\", \"ACTIVE\", \"Premium\", null, \"+351123\"),
            new com.mytelco.customerbff.model.UsageSummary(4500, 10000, 320, 1000, 45, 500, 45.0, 32.0, 9.0),
            new com.mytelco.customerbff.model.BillingSummary(new java.math.BigDecimal(\"29.99\"), new java.math.BigDecimal(\"49.99\"), null, null, \"Credit Card\", true),
            Instant.now()
        );
        
        when(aggregationService.getDashboard(\"12345\")).thenReturn(mockResponse);

        // Act & Assert
        mockMvc.perform(get(\"/api/v1/customer/dashboard\"))
            .andExpect(status().isOk())
            .andExpect(jsonPath(\"$.accountSummary.accountId\").value(\"ACC-123\"))
            .andExpect(jsonPath(\"$.usageSummary.dataUsedMb\").value(4500))
            .andExpect(jsonPath(\"$.billingSummary.currentBalance\").value(29.99));
    }

    @Test
    void getDashboardByCustomerId_shouldReturnDataForSpecificCustomer() throws Exception {
        // Arrange
        var mockResponse = new com.mytelco.customerbff.model.CustomerDashboardResponse(
            new com.mytelco.customerbff.model.AccountSummary(\"ACC-999\", \"ACTIVE\", \"Basic\", null, \"+351999\"),
            new com.mytelco.customerbff.model.UsageSummary(1000, 5000, 50, 500, 10, 100, 20.0, 10.0, 10.0),
            new com.mytelco.customerbff.model.BillingSummary(new java.math.BigDecimal(\"19.99\"), new java.math.BigDecimal(\"19.99\"), null, null, \"Debit Card\", false),
            Instant.now()
        );
        
        when(aggregationService.getDashboard(\"999\")).thenReturn(mockResponse);

        // Act & Assert
        mockMvc.perform(get(\"/api/v1/customer/999/dashboard\"))
            .andExpect(status().isOk())
            .andExpect(jsonPath(\"$.accountSummary.accountId\").value(\"ACC-999\"));
    }
}
