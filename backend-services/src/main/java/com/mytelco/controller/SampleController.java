package com.mytelco.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Sample REST controller for the backend service.
 * Replace with actual business logic.
 */
@RestController
@RequestMapping("/api/v1")
public class SampleController {

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "backend-service",
            "version", "1.0.0-SNAPSHOT"
        ));
    }

    @GetMapping("/info")
    public ResponseEntity<Map<String, String>> info() {
        return ResponseEntity.ok(Map.of(
            "message", "Backend Service is running",
            "purpose", "Core backend service for Telco Self-Care Platform"
        ));
    }
}
