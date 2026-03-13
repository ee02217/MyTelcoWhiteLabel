package com.mytelco.customerbff;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mytelco.customerbff.controller.TmfFacadeController;
import com.mytelco.customerbff.model.AccountSummary;
import com.mytelco.customerbff.model.BillingSummary;
import com.mytelco.customerbff.model.CatalogOffer;
import com.mytelco.customerbff.model.CatalogOfferPrice;
import com.mytelco.customerbff.model.CatalogOfferTerms;
import com.mytelco.customerbff.model.CatalogOfferType;
import com.mytelco.customerbff.model.CatalogResponse;
import com.mytelco.customerbff.model.CustomerDashboardResponse;
import com.mytelco.customerbff.model.CustomerOrderCreateRequest;
import com.mytelco.customerbff.model.CustomerOrderResponse;
import com.mytelco.customerbff.model.OrderState;
import com.mytelco.customerbff.model.tmf.TmfAccount;
import com.mytelco.customerbff.model.tmf.TmfBill;
import com.mytelco.customerbff.model.tmf.TmfMoney;
import com.mytelco.customerbff.model.tmf.TmfProductOffering;
import com.mytelco.customerbff.model.tmf.TmfProductOrder;
import com.mytelco.customerbff.model.tmf.TmfProductOrderItem;
import com.mytelco.customerbff.model.tmf.TmfProductRef;
import com.mytelco.customerbff.model.tmf.TmfRelatedParty;
import com.mytelco.customerbff.service.CatalogService;
import com.mytelco.customerbff.service.CustomerAggregationService;
import com.mytelco.customerbff.service.CustomerOrderService;
import com.mytelco.customerbff.service.tmf.TmfFacadeMappingService;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TmfFacadeController.class)
class TmfFacadeControllerContractTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CatalogService catalogService;

    @MockBean
    private CustomerOrderService customerOrderService;

    @MockBean
    private CustomerAggregationService customerAggregationService;

    @MockBean
    private TmfFacadeMappingService mappingService;

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void getProductOffering_contractFieldsArePresent() throws Exception {
        CatalogOffer offer = new CatalogOffer(
            "plan-premium-unlimited",
            "Premium Unlimited 5G",
            CatalogOfferType.PLAN,
            true,
            "eligible",
            new CatalogOfferPrice(new BigDecimal("29.99"), "EUR"),
            "2026-04-01",
            new CatalogOfferTerms("24-month commitment", "terms://plans/premium")
        );
        when(catalogService.getCatalog("line-22", "vodafone-pt", null)).thenReturn(new CatalogResponse("line-22", "vodafone-pt", List.of(offer)));
        when(mappingService.toProductOffering(any())).thenReturn(new TmfProductOffering(
            "plan-premium-unlimited",
            "/tmf-api/productCatalogManagement/v4/productOffering/plan-premium-unlimited",
            "Premium Unlimited 5G",
            "24-month commitment",
            "active",
            List.of(new TmfMoney(new BigDecimal("29.99"), "EUR")),
            "ProductOffering"
        ));

        mockMvc.perform(get("/api/v1/customer/tmf/productOffering/plan-premium-unlimited")
                .param("lineId", "line-22")
                .param("operatorId", "vodafone-pt"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value("plan-premium-unlimited"))
            .andExpect(jsonPath("$.lifecycleStatus").value("active"))
            .andExpect(jsonPath("$.price[0].taxIncludedAmount").value(29.99));
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void createProductOrder_contractFieldsArePresent() throws Exception {
        when(customerOrderService.create(any(CustomerOrderCreateRequest.class), anyString())).thenReturn(new CustomerOrderResponse(
            "ord_abc123",
            "line-22",
            "add",
            "plan-premium-unlimited",
            "ext-1",
            OrderState.COMPLETED,
            false,
            "Order completed",
            Instant.parse("2026-03-13T09:00:00Z"),
            Instant.parse("2026-03-13T09:01:00Z")
        ));
        when(mappingService.toProductOrder(any(), anyString())).thenReturn(new TmfProductOrder(
            "ord_abc123",
            "/tmf-api/productOrderingManagement/v4/productOrder/ord_abc123",
            "ext-1",
            "COMPLETED",
            new TmfProductOrderItem("1", "add", "COMPLETED", new TmfProductRef("plan-premium-unlimited", "/tmf-api/productCatalogManagement/v4/productOffering/plan-premium-unlimited", "plan-premium-unlimited", "ProductOffering")),
            "ProductOrder"
        ));

        mockMvc.perform(post("/api/v1/customer/tmf/productOrder")
                .with(csrf())
                .header("Idempotency-Key", "ext-1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new com.mytelco.customerbff.model.tmf.TmfProductOrderCreateRequest(
                    "ext-1",
                    "line-22",
                    "add",
                    "plan-premium-unlimited",
                    false
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value("ord_abc123"))
            .andExpect(jsonPath("$.state").value("COMPLETED"))
            .andExpect(jsonPath("$.productOrderItem.product.id").value("plan-premium-unlimited"));
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void getAccount_contractFieldsArePresent() throws Exception {
        when(customerAggregationService.getDashboard("acc-123")).thenReturn(new CustomerDashboardResponse(
            new AccountSummary("acc-123", "ACTIVE", "Premium Unlimited", LocalDateTime.parse("2026-01-01T00:00:00"), "351910000000"),
            null,
            new BillingSummary(new BigDecimal("13.20"), new BigDecimal("25.00"), LocalDate.parse("2026-03-01"), LocalDate.parse("2026-03-20"), "CARD", true),
            Instant.parse("2026-03-13T09:00:00Z")
        ));
        when(mappingService.toAccount(any())).thenReturn(new TmfAccount(
            "acc-123",
            "/tmf-api/accountManagement/v4/account/acc-123",
            "Premium Unlimited",
            "ACTIVE",
            new TmfRelatedParty("351910000000", "customer", "351910000000", "Individual"),
            "Account"
        ));

        mockMvc.perform(get("/api/v1/customer/tmf/account/acc-123"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value("acc-123"))
            .andExpect(jsonPath("$.status").value("ACTIVE"))
            .andExpect(jsonPath("$.relatedParty.id").value("351910000000"));
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void getBill_contractFieldsArePresent() throws Exception {
        when(customerAggregationService.getDashboard("cust-1")).thenReturn(new CustomerDashboardResponse(
            new AccountSummary("acc-123", "ACTIVE", "Premium Unlimited", LocalDateTime.parse("2026-01-01T00:00:00"), "351910000000"),
            null,
            new BillingSummary(new BigDecimal("13.20"), new BigDecimal("25.00"), LocalDate.parse("2026-03-01"), LocalDate.parse("2026-03-20"), "CARD", true),
            Instant.parse("2026-03-13T09:00:00Z")
        ));
        when(mappingService.toBill("bill-2026-03", new BillingSummary(new BigDecimal("13.20"), new BigDecimal("25.00"), LocalDate.parse("2026-03-01"), LocalDate.parse("2026-03-20"), "CARD", true)))
            .thenReturn(new TmfBill("bill-2026-03", "/tmf-api/billingManagement/v4/bill/bill-2026-03", "issued", new TmfMoney(new BigDecimal("13.20"), "EUR"), "2026-03-20", "Bill"));

        mockMvc.perform(get("/api/v1/customer/tmf/bill/bill-2026-03").param("customerId", "cust-1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value("bill-2026-03"))
            .andExpect(jsonPath("$.state").value("issued"))
            .andExpect(jsonPath("$.amountDue.taxIncludedAmount").value(13.20));
    }
}
