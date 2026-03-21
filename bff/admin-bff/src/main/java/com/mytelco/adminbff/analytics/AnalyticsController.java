package com.mytelco.adminbff.analytics;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/v1/admin/analytics")
public class AnalyticsController {

    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> getOverview() {
        Map<String, Object> overview = new HashMap<>();
        overview.put("totalUsers", 12458);
        overview.put("activeUsers", 8234);
        overview.put("totalRevenue", 456789.50);
        overview.put("arpu", 36.72);
        overview.put("churnRate", 2.3);
        overview.put("newUsersThisMonth", 342);
        return ResponseEntity.ok(overview);
    }

    @GetMapping("/revenue")
    public ResponseEntity<List<Map<String, Object>>> getRevenueData(
            @RequestParam(defaultValue = "30") int days) {
        List<Map<String, Object>> data = new ArrayList<>();
        for (int i = days - 1; i >= 0; i--) {
            Map<String, Object> point = new HashMap<>();
            point.put("date", LocalDate.now().minusDays(i).toString());
            point.put("revenue", 15000 + Math.random() * 5000);
            point.put("newSubscriptions", 10 + (int)(Math.random() * 20));
            point.put("cancellations", 2 + (int)(Math.random() * 8));
            data.add(point);
        }
        return ResponseEntity.ok(data);
    }

    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> getUserAnalytics(
            @RequestParam(defaultValue = "30") int days) {
        Map<String, Object> analytics = new HashMap<>();
        
        List<Map<String, Object>> growth = new ArrayList<>();
        for (int i = days - 1; i >= 0; i--) {
            Map<String, Object> point = new HashMap<>();
            point.put("date", LocalDate.now().minusDays(i).toString());
            point.put("total", 12000 + (days - i) * 15);
            point.put("active", 7800 + (days - i) * 12);
            growth.add(point);
        }
        analytics.put("growth", growth);
        
        analytics.put("topPlans", List.of(
            Map.of("name", "Premium 50GB", "count", 5234),
            Map.of("name", "Basic 10GB", "count", 4123),
            Map.of("name", "Unlimited", "count", 3101)
        ));
        
        analytics.put("topCountries", List.of(
            Map.of("country", "Portugal", "users", 8456),
            Map.of("country", "Spain", "users", 2345),
            Map.of("country", "France", "users", 1657)
        ));
        
        return ResponseEntity.ok(analytics);
    }

    @GetMapping("/usage")
    public ResponseEntity<Map<String, Object>> getUsageAnalytics() {
        Map<String, Object> usage = new HashMap<>();
        
        usage.put("avgDataUsageMb", 28500.0);
        usage.put("avgVoiceMinutes", 234.5);
        usage.put("avgSmsCount", 45.2);
        
        List<Map<String, Object>> dataUsageByHour = new ArrayList<>();
        for (int h = 0; h < 24; h++) {
            Map<String, Object> point = new HashMap<>();
            point.put("hour", h);
            point.put("mbUsed", 1000 + Math.random() * 2000);
            dataUsageByHour.add(point);
        }
        usage.put("dataUsageByHour", dataUsageByHour);
        
        return ResponseEntity.ok(usage);
    }

    @GetMapping("/export")
    public ResponseEntity<Map<String, Object>> exportAnalytics(
            @RequestParam(defaultValue = "json") String format) {
        Map<String, Object> data = new HashMap<>();
        data.put("generatedAt", LocalDate.now().toString());
        data.put("format", format);
        data.put("url", "/api/v1/admin/analytics/download?format=" + format);
        return ResponseEntity.ok(data);
    }
}
