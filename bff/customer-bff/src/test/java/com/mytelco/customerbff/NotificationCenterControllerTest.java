package com.mytelco.customerbff;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mytelco.customerbff.controller.NotificationCenterController;
import com.mytelco.customerbff.model.NotificationCategory;
import com.mytelco.customerbff.model.NotificationCategoryPreference;
import com.mytelco.customerbff.model.NotificationChannel;
import com.mytelco.customerbff.model.NotificationChannelDelivery;
import com.mytelco.customerbff.model.NotificationChannelPreference;
import com.mytelco.customerbff.model.NotificationDeliveryStatus;
import com.mytelco.customerbff.model.NotificationInboxItem;
import com.mytelco.customerbff.model.NotificationPreferencesResponse;
import com.mytelco.customerbff.security.CustomerIdentityResolver;
import com.mytelco.customerbff.service.NotificationCenterService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(NotificationCenterController.class)
class NotificationCenterControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private NotificationCenterService notificationCenterService;

    @MockBean
    private CustomerIdentityResolver customerIdentityResolver;

    @Test
    @WithMockUser(username = "cust-1", roles = "CUSTOMER")
    void shouldGetInbox() throws Exception {
        when(customerIdentityResolver.resolveCustomerId(any())).thenReturn("cust-1");
        when(notificationCenterService.getInbox("cust-1")).thenReturn(List.of(
            new NotificationInboxItem(
                "n1",
                "cust-1",
                "Order update",
                "Your order shipped.",
                NotificationCategory.ORDERS,
                List.of(
                    new NotificationChannelDelivery(NotificationChannel.PUSH, NotificationDeliveryStatus.DELIVERED, Instant.now())
                ),
                Instant.now(),
                null
            )
        ));

        mockMvc.perform(get("/api/v1/customer/notifications/inbox"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].category").value("ORDERS"));
    }

    @Test
    @WithMockUser(username = "cust-1", roles = "CUSTOMER")
    void shouldGetPreferences() throws Exception {
        when(customerIdentityResolver.resolveCustomerId(any())).thenReturn("cust-1");
        when(notificationCenterService.getPreferences("cust-1")).thenReturn(new NotificationPreferencesResponse(
            "cust-1",
            List.of(new NotificationCategoryPreference(
                NotificationCategory.BILLING,
                List.of(new NotificationChannelPreference(NotificationChannel.EMAIL, true))
            )),
            Instant.now(),
            "cust-1"
        ));

        mockMvc.perform(get("/api/v1/customer/notifications/preferences"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.categories[0].category").value("BILLING"));
    }

    @Test
    @WithMockUser(username = "cust-1", roles = "CUSTOMER")
    void shouldUpdatePreferences() throws Exception {
        when(customerIdentityResolver.resolveCustomerId(any())).thenReturn("cust-1");
        when(notificationCenterService.updatePreferences(eq("cust-1"), any(), eq("cust-1")))
            .thenReturn(new NotificationPreferencesResponse("cust-1", List.of(), Instant.now(), "cust-1"));

        mockMvc.perform(put("/api/v1/customer/notifications/preferences")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    java.util.Map.of("categories", List.of(
                        java.util.Map.of(
                            "category", "BILLING",
                            "channels", java.util.Map.of("EMAIL", true, "SMS", false)
                        )
                    ))
                )))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.customerId").value("cust-1"));
    }

    @Test
    @WithMockUser(username = "cust-1", roles = "CUSTOMER")
    void shouldSendTestNotification() throws Exception {
        when(customerIdentityResolver.resolveCustomerId(any())).thenReturn("cust-1");
        when(notificationCenterService.sendTestNotification(eq("cust-1"), any()))
            .thenReturn(new NotificationInboxItem(
                "n2",
                "cust-1",
                "Test",
                "Test message",
                NotificationCategory.SERVICE,
                List.of(),
                Instant.now(),
                null
            ));

        mockMvc.perform(post("/api/v1/customer/notifications/test-send")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(java.util.Map.of(
                    "title", "Test",
                    "message", "Test message",
                    "category", "SERVICE"
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.notificationId").value("n2"));
    }
}
