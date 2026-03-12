package com.mytelco.adminbff;

import com.mytelco.adminbff.controller.AdminDashboardController;
import com.mytelco.adminbff.service.AdminAggregationService;
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
 * Basic unit tests for AdminDashboardController.
 */
@WebMvcTest(AdminDashboardController.class)
class AdminDashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AdminAggregationService aggregationService;

    @Test
    void getDashboard_shouldReturnAggregatedData() throws Exception {
        // Arrange
        var mockResponse = new com.mytelco.adminbff.model.AdminDashboardResponse(
            new com.mytelco.adminbff.model.TenantSummary(\"TENANT-1\", \"Demo Operator\", 15000, 12500, \"ACTIVE\", null),
            new com.mytelco.adminbff.model.OfferSummary(25, 18, 5, 2, \"Premium Unlimited\", 12.5),
            new com.mytelco.adminbff.model.OpsSummary(2, 5, 99.95, 150000, 125.0, \"HEALTHY\"),
            Instant.now()
        );
        
        when(aggregationService.getDashboard(\"default\")).thenReturn(mockResponse);

        // Act & Assert
        mockMvc.perform(get(\"/api/v1/admin/dashboard\"))
            .andExpect(status().isOk())
            .andExpect(jsonPath(\"$.tenantSummary.tenantName\").value(\"Demo Operator\"))
            .andExpect(jsonPath(\"$.offerSummary.activeOffers\").value(18))
            .andExpect(jsonPath(\"$.opsSummary.systemUptime\").value(99.95));
    }

    @Test
    void getDashboardByTenantId_shouldReturnDataForSpecificTenant() throws Exception {
        // Arrange
        var mockResponse = new com.mytelco.adminbff.model.AdminDashboardResponse(
            new com.mytelco.adminbff.model.TenantSummary(\"TENANT-999\", \"Test Operator\", 5000, 4500, \"ACTIVE\", null),
            new com.mytelco.adminbff.model.OfferSummary(10, 8, 2, 0, \"Basic Plan\", 8.0),
            new com.mytelco.adminbff.model.OpsSummary(0, 3, 100.0, 50000, 80.0, \"HEALTHY\"),
            Instant.now()
        );
        
        when(aggregationService.getDashboard(\"999\")).thenReturn(mockResponse);

        // Act & Assert
        mockMvc.perform(get(\"/api/v1/admin/999/dashboard\"))
            .andExpect(status().isOk())
            .andExpect(jsonPath(\"$.tenantSummary.tenantId\").value(\"TENANT-999\"));
    }
}
