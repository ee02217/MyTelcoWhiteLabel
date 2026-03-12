package com.mytelco.customerbff;

import com.mytelco.customerbff.controller.PaymentHistoryController;
import com.mytelco.customerbff.model.PaymentHistoryItem;
import com.mytelco.customerbff.model.PaymentHistoryResponse;
import com.mytelco.customerbff.model.PaymentRetryResponse;
import com.mytelco.customerbff.service.PaymentHistoryService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PaymentHistoryController.class)
class PaymentHistoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PaymentHistoryService paymentHistoryService;

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void history_shouldReturnPayments() throws Exception {
        PaymentHistoryResponse response = new PaymentHistoryResponse(
            12,
            List.of(
                new PaymentHistoryItem(
                    "pay_001",
                    OffsetDateTime.now(ZoneOffset.UTC),
                    new BigDecimal("49.99"),
                    "EUR",
                    "Visa •••• 4242",
                    "SUCCESS",
                    "INV-2026-002"
                )
            )
        );
        when(paymentHistoryService.getHistory(eq(12))).thenReturn(response);

        mockMvc.perform(get("/api/v1/customer/payments/history").param("months", "12"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.months").value(12))
            .andExpect(jsonPath("$.payments[0].paymentId").value("pay_001"));
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void receiptDownload_shouldExposePdfHeaders() throws Exception {
        when(paymentHistoryService.getPayment(eq("pay_001"))).thenReturn(
            Optional.of(new PaymentHistoryItem(
                "pay_001",
                OffsetDateTime.now(ZoneOffset.UTC),
                new BigDecimal("49.99"),
                "EUR",
                "Visa •••• 4242",
                "SUCCESS",
                "INV-2026-002"
            ))
        );

        mockMvc.perform(get("/api/v1/customer/payments/receipt/pay_001/download"))
            .andExpect(status().isOk())
            .andExpect(header().string("Content-Type", "application/pdf"))
            .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("attachment;")));
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void retry_shouldReturnResponse() throws Exception {
        when(paymentHistoryService.retryPayment(eq("pay_002"), eq("idem-retry-2"))).thenReturn(
            new PaymentRetryResponse("pay_002", "SUCCESS", "Retry accepted and payment completed", "idem-retry-2")
        );

        mockMvc.perform(post("/api/v1/customer/payments/pay_002/retry")
                .with(csrf())
                .header("Idempotency-Key", "idem-retry-2"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("SUCCESS"))
            .andExpect(jsonPath("$.idempotencyKey").value("idem-retry-2"));
    }
}
