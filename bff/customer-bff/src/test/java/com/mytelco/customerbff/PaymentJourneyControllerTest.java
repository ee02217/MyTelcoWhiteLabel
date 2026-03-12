package com.mytelco.customerbff;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mytelco.customerbff.controller.PaymentJourneyController;
import com.mytelco.customerbff.model.CheckoutRequest;
import com.mytelco.customerbff.model.CheckoutResponse;
import com.mytelco.customerbff.model.PaymentMethodRegistrationRequest;
import com.mytelco.customerbff.model.PaymentMethodRegistrationResponse;
import com.mytelco.customerbff.service.PaymentJourneyService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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

        when(paymentJourneyService.checkout(eq(payload), eq("idem-1"))).thenReturn(replay);

        mockMvc.perform(post("/api/v1/customer/payments/checkout")
                .with(csrf())
                .header("Idempotency-Key", "idem-1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("SUCCESS"))
            .andExpect(jsonPath("$.idempotencyKey").value("idem-1"));
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void checkout_shouldHandleFailure() throws Exception {
        CheckoutRequest payload = new CheckoutRequest("tok_1", new BigDecimal("999.99"), "EUR", "FAIL");
        when(paymentJourneyService.checkout(eq(payload), eq("idem-fail"))).thenReturn(
            new CheckoutResponse("tx_2", "FAILED", "Payment declined by provider simulator", "idem-fail")
        );

        mockMvc.perform(post("/api/v1/customer/payments/checkout")
                .with(csrf())
                .header("Idempotency-Key", "idem-fail")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("FAILED"));
    }
}
