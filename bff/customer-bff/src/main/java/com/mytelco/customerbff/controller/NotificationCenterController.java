package com.mytelco.customerbff.controller;

import com.mytelco.customerbff.model.NotificationInboxItem;
import com.mytelco.customerbff.model.NotificationPreferencesResponse;
import com.mytelco.customerbff.model.NotificationPreferencesUpdateRequest;
import com.mytelco.customerbff.model.NotificationTestSendRequest;
import com.mytelco.customerbff.security.CustomerIdentityResolver;
import com.mytelco.customerbff.service.NotificationCenterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/customer/notifications")
@Tag(name = "Notification Center", description = "Inbox and channel preferences")
public class NotificationCenterController {

    private final NotificationCenterService notificationCenterService;
    private final CustomerIdentityResolver customerIdentityResolver;

    public NotificationCenterController(
        NotificationCenterService notificationCenterService,
        CustomerIdentityResolver customerIdentityResolver
    ) {
        this.notificationCenterService = notificationCenterService;
        this.customerIdentityResolver = customerIdentityResolver;
    }

    @GetMapping("/inbox")
    @Operation(summary = "Get notification inbox")
    @ApiResponses(@ApiResponse(responseCode = "200", description = "Inbox returned"))
    public ResponseEntity<List<NotificationInboxItem>> getInbox(Authentication authentication) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        return ResponseEntity.ok(notificationCenterService.getInbox(customerId));
    }

    @GetMapping("/preferences")
    @Operation(summary = "Get notification category/channel preferences")
    @ApiResponses(@ApiResponse(responseCode = "200", description = "Preferences returned"))
    public ResponseEntity<NotificationPreferencesResponse> getPreferences(Authentication authentication) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        return ResponseEntity.ok(notificationCenterService.getPreferences(customerId));
    }

    @PutMapping("/preferences")
    @Operation(summary = "Update notification preferences")
    @ApiResponses(@ApiResponse(responseCode = "200", description = "Preferences updated"))
    public ResponseEntity<NotificationPreferencesResponse> updatePreferences(
        Authentication authentication,
        @Valid @RequestBody NotificationPreferencesUpdateRequest request
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        return ResponseEntity.ok(notificationCenterService.updatePreferences(customerId, request, customerId));
    }

    @PostMapping("/test-send")
    @Operation(summary = "Send test notification (MVP helper)")
    @ApiResponses(@ApiResponse(responseCode = "200", description = "Notification generated"))
    public ResponseEntity<NotificationInboxItem> testSend(
        Authentication authentication,
        @Valid @RequestBody NotificationTestSendRequest request
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        return ResponseEntity.ok(notificationCenterService.sendTestNotification(customerId, request));
    }
}
