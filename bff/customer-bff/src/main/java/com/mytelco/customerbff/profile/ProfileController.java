package com.mytelco.customerbff.profile;

import com.mytelco.customerbff.security.CustomerIdentityResolver;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/customer/profile")
public class ProfileController {

    private final ProfileService profileService;
    private final CustomerIdentityResolver customerIdentityResolver;

    public ProfileController(ProfileService profileService, CustomerIdentityResolver customerIdentityResolver) {
        this.profileService = profileService;
        this.customerIdentityResolver = customerIdentityResolver;
    }

    @GetMapping
    public ResponseEntity<CustomerProfile> getProfile(Authentication authentication) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        return ResponseEntity.ok(profileService.getProfile(customerId));
    }

    @PutMapping
    public ResponseEntity<CustomerProfile> updateProfile(
        Authentication authentication,
        @RequestBody UpdateProfileRequest request
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        return ResponseEntity.ok(profileService.updateProfile(customerId, request));
    }

    @GetMapping("/notifications")
    public ResponseEntity<NotificationPreferences> getNotificationPrefs(Authentication authentication) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        return ResponseEntity.ok(profileService.getProfile(customerId).notificationPrefs());
    }

    @PutMapping("/notifications")
    public ResponseEntity<NotificationPreferences> updateNotificationPrefs(
        Authentication authentication,
        @RequestBody NotificationPreferences prefs
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        return ResponseEntity.ok(profileService.updateNotificationPrefs(customerId, prefs));
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<AccountSession>> getSessions(Authentication authentication) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        return ResponseEntity.ok(profileService.getProfile(customerId).sessions());
    }

    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<Map<String, Boolean>> revokeSession(
        Authentication authentication,
        @PathVariable String sessionId
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        boolean revoked = profileService.revokeSession(customerId, sessionId);
        return ResponseEntity.ok(Map.of("success", revoked));
    }

    @GetMapping("/export")
    public ResponseEntity<Map<String, String>> exportData(Authentication authentication) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        return ResponseEntity.ok(profileService.exportData(customerId));
    }

    @DeleteMapping
    public ResponseEntity<Map<String, String>> deleteAccount(Authentication authentication) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        boolean deleted = profileService.deleteAccount(customerId);
        return ResponseEntity.ok(Map.of(
            "deleted", String.valueOf(deleted),
            "message", "Account deletion scheduled. You will be logged out."
        ));
    }
}
