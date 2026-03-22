package com.mytelco.adminbff.users;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/v1/admin/users")
public class UsersController {

    private final Map<String, Map<String, Object>> users = new HashMap<>();
    private final List<Map<String, Object>> invitations = new ArrayList<>();

    public UsersController() {
        // Mock users
        for (int i = 1; i <= 10; i++) {
            String id = "user-" + i;
            users.put(id, Map.of(
                "id", id,
                "email", "user" + i + "@example.com",
                "name", "User " + i,
                "role", i == 1 ? "ADMIN" : "USER",
                "status", "ACTIVE",
                "createdAt", "2024-01-" + String.format("%02d", i) + "T10:00:00Z",
                "lastLogin", "2026-03-" + String.format("%02d", (i % 28) + 1) + "T14:30:00Z"
            ));
        }
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listUsers(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        List<Map<String, Object>> filtered = new ArrayList<>(users.values());
        
        if (!search.isEmpty()) {
            filtered = filtered.stream()
                .filter(u -> u.get("email").toString().contains(search) 
                          || u.get("name").toString().contains(search))
                .toList();
        }
        
        int start = page * size;
        int end = Math.min(start + size, filtered.size());
        List<Map<String, Object>> pageData = start < filtered.size() 
            ? filtered.subList(start, end) 
            : List.of();
        
        return ResponseEntity.ok(pageData);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getUser(@PathVariable String id) {
        Map<String, Object> user = users.get(id);
        return user != null ? ResponseEntity.ok(user) : ResponseEntity.notFound().build();
    }

    @PostMapping("/invite")
    public ResponseEntity<Map<String, Object>> inviteUser(@RequestBody InviteRequest request) {
        String id = "inv-" + System.currentTimeMillis();
        Map<String, Object> invitation = new HashMap<>();
        invitation.put("id", id);
        invitation.put("email", request.email());
        invitation.put("role", request.role());
        invitation.put("status", "PENDING");
        invitation.put("sentAt", Instant.now().toString());
        invitation.put("expiresAt", Instant.now().plusSeconds(86400 * 7).toString());
        
        invitations.add(invitation);
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "invitation", invitation
        ));
    }

    @PostMapping("/bulk-invite")
    public ResponseEntity<Map<String, Object>> bulkInvite(@RequestBody BulkInviteRequest request) {
        List<Map<String, Object>> results = new ArrayList<>();
        int successCount = 0;
        
        for (String email : request.emails()) {
            if (email.contains("@")) {
                String id = "inv-" + System.currentTimeMillis() + "-" + successCount;
                Map<String, Object> invitation = new HashMap<>();
                invitation.put("id", id);
                invitation.put("email", email);
                invitation.put("role", request.role());
                invitation.put("status", "PENDING");
                invitation.put("sentAt", Instant.now().toString());
                invitations.add(invitation);
                results.add(Map.of("email", email, "status", "sent"));
                successCount++;
            } else {
                results.add(Map.of("email", email, "status", "failed", "error", "Invalid email"));
            }
        }
        
        return ResponseEntity.ok(Map.of(
            "sent", successCount,
            "failed", request.emails().size() - successCount,
            "results", results
        ));
    }

    @PostMapping("/bulk-update")
    public ResponseEntity<Map<String, Object>> bulkUpdate(@RequestBody BulkUpdateRequest request) {
        int updated = 0;
        for (String userId : request.userIds()) {
            if (users.containsKey(userId)) {
                Map<String, Object> user = new HashMap<>(users.get(userId));
                user.putAll(request.updates());
                users.put(userId, user);
                updated++;
            }
        }
        return ResponseEntity.ok(Map.of("updated", updated));
    }

    @PostMapping("/bulk-delete")
    public ResponseEntity<Map<String, Object>> bulkDelete(@RequestBody BulkDeleteRequest request) {
        int deleted = 0;
        for (String userId : request.userIds()) {
            if (users.remove(userId) != null) {
                deleted++;
            }
        }
        return ResponseEntity.ok(Map.of("deleted", deleted));
    }

    @GetMapping("/export")
    public ResponseEntity<Map<String, Object>> exportUsers(
            @RequestParam(defaultValue = "json") String format) {
        return ResponseEntity.ok(Map.of(
            "url", "/api/v1/admin/users/download?format=" + format,
            "format", format,
            "count", users.size()
        ));
    }
}

record InviteRequest(String email, String role) {}
record BulkInviteRequest(List<String> emails, String role) {}
record BulkUpdateRequest(List<String> userIds, Map<String, Object> updates) {}
record BulkDeleteRequest(List<String> userIds) {}
