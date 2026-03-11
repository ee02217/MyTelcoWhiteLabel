package com.mytelco.bff.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Sample REST controller for the BFF service.
 * This demonstrates how a BFF aggregates data from backend services.
 * Replace with actual business logic.
 */
@RestController
@RequestMapping("/v1")
public class SampleBffController {

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "bff-service",
            "version", "1.0.0-SNAPSHOT",
            "type", "BFF (Backend-for-Frontend)"
        ));
    }

    @GetMapping("/info")
    public ResponseEntity<Map<String, String>> info() {
        return ResponseEntity.ok(Map.of(
            "message", "BFF Service is running",
            "purpose", "Aggregates backend services for frontend consumption",
            "port", "8081"
        ));
    }

    /**
     * Example BFF endpoint that would aggregate data from multiple services.
     * Replace with actual implementation using WebClient to call backend services.
     */
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> dashboard() {
        // In production, this would call multiple backend services
        // and aggregate the responses for the frontend
        return ResponseEntity.ok(Map.of(
            "message", "Dashboard endpoint - implement aggregation logic here",
            "example", Map.of(
                "userData", "Call user service",
                "accountData", "Call account service",
                "usageData", "Call usage service"
            )
        ));
    }
}
