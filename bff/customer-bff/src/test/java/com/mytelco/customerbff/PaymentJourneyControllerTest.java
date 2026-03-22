package com.mytelco.customerbff;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mytelco.customerbff.analytics.ProductAnalyticsService;
import com.mytelco.customerbff.controller.PaymentJourneyController;
import com.mytelco.customerbff.family.FamilyPermission;
import com.mytelco.customerbff.family.FamilyRole;
import com.mytelco.customerbff.family.FamilyRoleEntry;
import com.mytelco.customerbff.family.FamilyRoleService;
import com.mytelco.customerbff.family.FamilyRolesResponse;
import com.mytelco.customerbff.family.controls.SharedControlService;
import com.mytelco.customerbff.model.CheckoutRequest;
import com.mytelco.customerbff.model.CheckoutResponse;
import com.mytelco.customerbff.model.PaymentMethodRegistrationRequest;
import com.mytelco.customerbff.model.PaymentMethodRegistrationResponse;
import com.mytelco.customerbff.operator.OperatorContextResolver;
import com.mytelco.customerbff.security.CustomerIdentityResolver;
import com.mytelco.customerbff.service.PaymentJourneyService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PaymentJourneyController.class)
class PaymentJourneyControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PaymentJourneyService paymentJourneyService;

    @MockBean
    private CustomerIdentityResolver customerIdentityResolver;

    @MockBean
    private OperatorContextResolver operatorContextResolver;

    @MockBean
    private ProductAnalyticsService productAnalyticsService;

    @MockBean
    private FamilyRoleService familyRoleService;

    @MockBean
    private SharedControlService sharedControlService;

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void registerPaymentMethod_shouldReturnToken() throws Exception {
        when(paymentJourneyService.registerPaymentMethod(any())).thenReturn(
            new PaymentMethodRegistrationResponse("pm_1", "tok_1", "REGISTERED")
        );

        mockMvc.perform(post("/api/v1/customer/payments/methods")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new PaymentMethodRegistrationRequest("Jane Doe", "4242", "VISA", "12/30"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").value("tok_1"));
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void checkout_shouldReturnIdempotentReplay() throws Exception {
        CheckoutRequest payload = new CheckoutRequest("tok_1", new BigDecimal("39.90"), "EUR", "INV-35");
        CheckoutResponse replay = new CheckoutResponse("tx_1", "SUCCESS", "Payment processed successfully", "idem-1");

        when(customerIdentityResolver.resolveCustomerId(any())).thenReturn("cust-1");
        when(operatorContextResolver.resolveOperatorId(anyString())).thenReturn("operator-stub-pt");
        when(familyRoleService.getRoles(eq("cust-1"), any())).thenReturn(sampleFamilyRoles());
        when(paymentJourneyService.checkout(eq(payload), eq("idem-1"))).thenReturn(replay);

        mockMvc.perform(post("/api/v1/customer/payments/checkout")
                .with(csrf())
                .header("Idempotency-Key", "idem-1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("SUCCESS"))
            .andExpect(jsonPath("$.idempotencyKey").value("idem-1"));

        verify(productAnalyticsService).trackBillPayCheckoutStarted(
            eq("cust-1"),
            eq("operator-stub-pt"),
            eq("web"),
            any(),
            eq("INV-35"),
            eq("idem-1"),
            eq("EUR"),
            eq("39.90")
        );

        verify(productAnalyticsService).trackBillPayCheckoutCompleted(
            eq("cust-1"),
            eq("operator-stub-pt"),
            eq("web"),
            any(),
            eq("INV-35"),
            eq("SUCCESS"),
            eq("tx_1")
        );
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void checkout_shouldHandleFailure() throws Exception {
        CheckoutRequest payload = new CheckoutRequest("tok_1", new BigDecimal("999.99"), "EUR", "FAIL");
        CheckoutResponse response = new CheckoutResponse("tx_2", "FAILED", "Payment declined by provider simulator", "idem-fail");

        when(customerIdentityResolver.resolveCustomerId(any())).thenReturn("cust-1");
        when(operatorContextResolver.resolveOperatorId(anyString())).thenReturn("operator-stub-pt");
        when(familyRoleService.getRoles(eq("cust-1"), any())).thenReturn(sampleFamilyRoles());
        when(paymentJourneyService.checkout(eq(payload), eq("idem-fail"))).thenReturn(response);

        mockMvc.perform(post("/api/v1/customer/payments/checkout")
                .with(csrf())
                .header("Idempotency-Key", "idem-fail")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("FAILED"));

        verify(productAnalyticsService).trackBillPayCheckoutStarted(
            eq("cust-1"),
            eq("operator-stub-pt"),
            eq("web"),
            any(),
            eq("FAIL"),
            eq("idem-fail"),
            eq("EUR"),
            eq("999.99")
        );
        verify(productAnalyticsService).trackBillPayCheckoutCompleted(
            eq("cust-1"),
            eq("operator-stub-pt"),
            eq("web"),
            any(),
            eq("FAIL"),
            eq("FAILED"),
            eq("tx_2")
        );
    }

    private FamilyRolesResponse sampleFamilyRoles() {
        return new FamilyRolesResponse(
            "cust-1",
            "line-1",
            FamilyRole.OWNER,
            List.of(FamilyPermission.MANAGE_PAYMENTS),
            List.of(
                new FamilyRoleEntry("line-1", "3515000001", "Primary", "ACTIVE", FamilyRole.OWNER, List.of(FamilyPermission.MANAGE_PAYMENTS))
            ),
            Map.of(FamilyRole.OWNER, List.of(FamilyPermission.MANAGE_PAYMENTS)),
            Instant.now()
        );
    }
}
