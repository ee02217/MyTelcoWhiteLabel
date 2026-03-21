package com.mytelco.adminbff.audit;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/v1/admin/audit")
public class AuditController {

    private final List<Map<String, Object>> logs = new ArrayList<>();

    public AuditController() {
        // Mock audit logs
        String[] actions = {"LOGIN", "LOGOUT", "USER_CREATE", "USER_UPDATE", "USER_DELETE", 
                           "PLAN_CHANGE", "LINE_ADD", "LINE_CANCEL", "PAYMENT", "SETTINGS_CHANGE"};
        String[] users = {"admin@mytelco.com", "operator1@mytelco.com", "support@mytelco.com"};
        
        for (int i = 0; i < 50; i++) {
            Map<String, Object> log = new HashMap<>();
            log.put("id", "audit-" + (i + 1));
            log.put("timestamp", Instant.now().minusSeconds(i * 3600).toString());
            log.put("action", actions[i % actions.length]);
            log.put("user", users[i % users.length]);
            log.put("ipAddress", "192.168.1." + (i % 255));
            log.put("details", Map.of("resource", "user-" + (i % 10), "changes", Map.of("field", "status", "old", "active", "new", "inactive")));
            logs.add(log);
        }
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getLogs(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String user,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        
        List<Map<String, Object>> filtered = new ArrayList<>(logs);
        
        if (action != null) {
            filtered = filtered.stream()
                .filter(l -> l.get("action").equals(action))
                .toList();
        }
        
        if (user != null) {
            filtered = filtered.stream()
                .filter(l -> l.get("user").toString().contains(user))
                .toList();
        }
        
        int start = page * size;
        int end = Math.min(start + size, filtered.size());
        List<Map<String, Object>> pageData = start < filtered.size()
            ? filtered.subList(start, end)
            : List.of();
        
        Map<String, Object> response = new HashMap<>();
        response.put("logs", pageData);
        response.put("total", filtered.size());
        response.put("page", page);
        response.put("size", size);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/actions")
    public ResponseEntity<List<String>> getActionTypes() {
        return ResponseEntity.ok(List.of(
            "LOGIN", "LOGOUT", "USER_CREATE", "USER_UPDATE", "USER_DELETE",
            "PLAN_CHANGE", "LINE_ADD", "LINE_CANCEL", "PAYMENT", "SETTINGS_CHANGE"
        ));
    }

    @GetMapping("/export")
    public ResponseEntity<Map<String, Object>> exportLogs(
            @RequestParam(defaultValue = "json") String format,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String user) {
        
        return ResponseEntity.ok(Map.of(
            "url", "/api/v1/admin/audit/download?format=" + format + 
                   (action != null ? "&action=" + action : "") +
                   (user != null ? "&user=" + user : ""),
            "format", format,
            "count", logs.size()
        ));
    }
}
