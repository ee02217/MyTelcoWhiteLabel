package com.mytelco.customerbff;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mytelco.customerbff.analytics.ProductAnalyticsService;
import com.mytelco.customerbff.controller.CatalogController;
import com.mytelco.customerbff.family.FamilyRoleService;
import com.mytelco.customerbff.model.CatalogConfirmSelectionRequest;
import com.mytelco.customerbff.model.CatalogConfirmSelectionResponse;
import com.mytelco.customerbff.model.CatalogOffer;
import com.mytelco.customerbff.model.CatalogOfferPrice;
import com.mytelco.customerbff.model.CatalogOfferTerms;
import com.mytelco.customerbff.model.CatalogOfferType;
import com.mytelco.customerbff.model.CatalogResponse;
import com.mytelco.customerbff.model.CatalogSelectedItem;
import com.mytelco.customerbff.model.CatalogTermsAcknowledgement;
import com.mytelco.customerbff.operator.OperatorContextResolver;
import com.mytelco.customerbff.security.CustomerIdentityResolver;
import com.mytelco.customerbff.service.CatalogService;
import java.math.BigDecimal;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CatalogController.class)
class CatalogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CatalogService catalogService;

    @MockBean
    private CustomerIdentityResolver customerIdentityResolver;

    @MockBean
    private OperatorContextResolver operatorContextResolver;

    @MockBean
    private ProductAnalyticsService productAnalyticsService;

    @MockBean
    private FamilyRoleService familyRoleService;

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void getCatalog_shouldReturnOffersWithEligibilityPriceDateTerms() throws Exception {
        when(catalogService.getCatalog(eq("line-22"), eq("vodafone-pt"), eq("plan"))).thenReturn(
            new CatalogResponse(
                "line-22",
                "vodafone-pt",
                List.of(new CatalogOffer(
                    "plan-starter-20",
                    "Starter 20GB",
                    CatalogOfferType.PLAN,
                    true,
                    "eligible",
                    new CatalogOfferPrice(new BigDecimal("14.99"), "EUR"),
                    "2026-04-01",
                    new CatalogOfferTerms("24-month commitment", "terms://plans/starter-20")
                ))
            )
        );

        mockMvc.perform(get("/api/v1/customer/catalog")
                .param("lineId", "line-22")
                .param("operatorId", "vodafone-pt")
                .param("type", "plan"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.offers[0].eligible").value(true))
            .andExpect(jsonPath("$.offers[0].pricing.amount").value(14.99))
            .andExpect(jsonPath("$.offers[0].effectiveDate").value("2026-04-01"))
            .andExpect(jsonPath("$.offers[0].terms.reference").value("terms://plans/starter-20"));
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void confirmSelection_shouldReturnTotalAndTerms() throws Exception {
        when(customerIdentityResolver.resolveCustomerId(any())).thenReturn("cust-1");
        when(operatorContextResolver.resolveOperatorId(anyString())).thenReturn("operator-stub-pt");
        when(catalogService.confirmSelection(any())).thenReturn(new CatalogConfirmSelectionResponse(
            "line-22",
            "vodafone-pt",
            new CatalogOfferPrice(new BigDecimal("19.98"), "EUR"),
            List.of(new CatalogSelectedItem(
                "plan-starter-20",
                "Starter 20GB",
                CatalogOfferType.PLAN,
                new CatalogOfferPrice(new BigDecimal("14.99"), "EUR"),
                "2026-04-01",
                new CatalogOfferTerms("24-month commitment", "terms://plans/starter-20")
            )),
            new CatalogTermsAcknowledgement(true, "terms://catalog/confirm", "2026-03-12T00:00:00Z")
        ));

        mockMvc.perform(post("/api/v1/customer/catalog/confirm-selection")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new CatalogConfirmSelectionRequest(
                    "line-22",
                    "vodafone-pt",
                    List.of("plan-starter-20"),
                    true,
                    "terms://catalog/confirm"
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalPrice.amount").value(19.98))
            .andExpect(jsonPath("$.termsAcknowledgement.accepted").value(true));

        verify(productAnalyticsService).trackPlanChangeConfirmed(
            eq("cust-1"),
            eq("operator-stub-pt"),
            eq("web"),
            anyString(),
            eq("line-22"),
            eq(1),
            eq(true)
        );
    }
}
