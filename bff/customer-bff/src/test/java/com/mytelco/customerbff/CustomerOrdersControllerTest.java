package com.mytelco.customerbff;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mytelco.customerbff.controller.CustomerOrdersController;
import com.mytelco.customerbff.family.FamilyRoleService;
import com.mytelco.customerbff.model.CustomerOrderCreateRequest;
import com.mytelco.customerbff.model.CustomerOrderResponse;
import com.mytelco.customerbff.model.OrderState;
import com.mytelco.customerbff.security.CustomerIdentityResolver;
import com.mytelco.customerbff.service.CustomerOrderService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CustomerOrdersController.class)
class CustomerOrdersControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CustomerOrderService customerOrderService;

    @MockBean
    private CustomerIdentityResolver customerIdentityResolver;

    @MockBean
    private FamilyRoleService familyRoleService;

    @Test
    @WithMockUser(username = "cust-1", roles = "CUSTOMER")
    void getOrder_shouldReturnOrderStateContract() throws Exception {
        CustomerOrderResponse response = new CustomerOrderResponse(
            "ord_1",
            "line-1",
            "PLAN",
            "PLAN-XL",
            "idem-1",
            OrderState.PROCESSING,
            false,
            "Order is being processed",
            Instant.parse("2026-03-13T07:00:00Z"),
            Instant.parse("2026-03-13T07:01:00Z")
        );

        when(customerIdentityResolver.resolveCustomerId(any())).thenReturn("cust-1");
        when(customerOrderService.getById("cust-1", "ord_1")).thenReturn(response);

        mockMvc.perform(get("/api/v1/customer/orders/ord_1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.orderId").value("ord_1"))
            .andExpect(jsonPath("$.state").value("PROCESSING"));
    }

    @Test
    @WithMockUser(username = "cust-1", roles = "CUSTOMER")
    void createOrder_shouldUseHeaderIdempotencyKey() throws Exception {
        CustomerOrderCreateRequest request = new CustomerOrderCreateRequest("line-7", "ADDON", "ADDON-5G", null, false);
        CustomerOrderResponse response = new CustomerOrderResponse(
            "ord_7",
            "line-7",
            "ADDON",
            "ADDON-5G",
            "idem-7",
            OrderState.COMPLETED,
            false,
            "Order completed successfully",
            Instant.now(),
            Instant.now()
        );

        when(customerIdentityResolver.resolveCustomerId(any())).thenReturn("cust-1");
        when(customerOrderService.create(eq(request), eq("idem-7"), eq("cust-1"))).thenReturn(response);

        mockMvc.perform(post("/api/v1/customer/orders")
                .with(csrf())
                .header("Idempotency-Key", "idem-7")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.idempotencyKey").value("idem-7"));
    }
}
