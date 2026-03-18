package com.mytelco.customerbff;

import com.mytelco.customerbff.controller.BillingExplorerController;
import com.mytelco.customerbff.model.BillCategoryGroup;
import com.mytelco.customerbff.model.BillExplorerResponse;
import com.mytelco.customerbff.model.BillItemCategory;
import com.mytelco.customerbff.model.BillPeriodComparison;
import com.mytelco.customerbff.model.BillPeriodSummary;
import com.mytelco.customerbff.model.InvoiceMetadata;
import com.mytelco.customerbff.security.CustomerIdentityResolver;
import com.mytelco.customerbff.service.BillingExplorerService;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(BillingExplorerController.class)
@Import(BillingExplorerControllerTest.TestMeterRegistryConfig.class)
class BillingExplorerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BillingExplorerService billingExplorerService;

    @MockBean
    private CustomerIdentityResolver customerIdentityResolver;

    @Test
    @WithMockUser(username = "cust-1", roles = "CUSTOMER")
    void getBillExplorer_shouldReturnGroupedPayload() throws Exception {
        when(customerIdentityResolver.resolveCustomerId(any())).thenReturn("cust-1");
        when(billingExplorerService.getBillExplorer("cust-1", YearMonth.of(2026, 3))).thenReturn(
            new BillExplorerResponse(
                "cust-1",
                "2026-03",
                LocalDate.of(2026, 3, 1),
                LocalDate.of(2026, 3, 31),
                List.of(
                    new BillCategoryGroup(BillItemCategory.PLAN, List.of(), new BigDecimal("34.99")),
                    new BillCategoryGroup(BillItemCategory.ADD_ONS, List.of(), new BigDecimal("4.99")),
                    new BillCategoryGroup(BillItemCategory.OVERAGES, List.of(), new BigDecimal("3.50")),
                    new BillCategoryGroup(BillItemCategory.TAXES, List.of(), new BigDecimal("9.99"))
                ),
                Map.of(
                    BillItemCategory.PLAN, new BigDecimal("34.99"),
                    BillItemCategory.ADD_ONS, new BigDecimal("4.99"),
                    BillItemCategory.OVERAGES, new BigDecimal("3.50"),
                    BillItemCategory.TAXES, new BigDecimal("9.99")
                ),
                new BigDecimal("53.47"),
                new BillPeriodComparison(
                    new BillPeriodSummary("2026-02", new BigDecimal("48.56")),
                    new BigDecimal("4.91"),
                    new BigDecimal("10.11")
                ),
                new InvoiceMetadata("INV-202603-12345", "INV-202603-12345.pdf", "/api/v1/customer/billing/invoice/INV-202603-12345/download")
            )
        );

        mockMvc.perform(get("/api/v1/customer/billing/explorer?period=2026-03"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalsByCategory.plan").value(34.99))
            .andExpect(jsonPath("$.comparison.deltaPercentage").value(10.11))
            .andExpect(jsonPath("$.invoice.downloadUrl").value("/api/v1/customer/billing/invoice/INV-202603-12345/download"));
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void downloadInvoice_shouldReturnPdfHeaders() throws Exception {
        when(billingExplorerService.getInvoicePdf("INV-202603-12345")).thenReturn(new ByteArrayResource("pdf".getBytes()));

        mockMvc.perform(get("/api/v1/customer/billing/invoice/INV-202603-12345/download"))
            .andExpect(status().isOk())
            .andExpect(header().string(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE))
            .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"INV-202603-12345.pdf\""));
    }

    @TestConfiguration
    static class TestMeterRegistryConfig {
        @Bean
        MeterRegistry meterRegistry() {
            return new SimpleMeterRegistry();
        }
    }
}
