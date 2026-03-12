package com.mytelco.adminbff.controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * REST controller for operator branding/theme endpoints.
 * Serves branding configurations for white-label operators.
 */
@RestController
@RequestMapping("/api/v1/theme")
public class ThemeController {

    private static final String BRANDING_PATH = "operators/%s/branding/config.json";
    private static final String DEFAULT_OPERATOR = "default";

    /**
     * Get branding configuration for a specific operator.
     * 
     * This endpoint serves the branding configuration that includes:
     * - Logo URLs (light/dark mode)
     * - Color palettes (primary, secondary, accent, etc.)
     * - Typography settings
     * - Semantic tokens mapping
     * - Custom CSS variables
     * 
     * @param operatorId The operator identifier (kebab-case)
     * @return Branding configuration JSON
     */
    @GetMapping(value = "/{operatorId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getBranding(@PathVariable String operatorId) {
        String resolvedOperatorId = (operatorId == null || operatorId.isBlank()) 
            ? DEFAULT_OPERATOR 
            : operatorId;
        
        try {
            // Try to load from classpath (for packaged JAR)
            String configPath = String.format(BRANDING_PATH, resolvedOperatorId);
            
            // First try operator-specific config
            Resource resource = new ClassPathResource(configPath);
            
            if (!resource.exists()) {
                // Fall back to default if operator not found
                if (!DEFAULT_OPERATOR.equals(resolvedOperatorId)) {
                    resource = new ClassPathResource(String.format(BRANDING_PATH, DEFAULT_OPERATOR));
                }
                
                if (!resource.exists()) {
                    return ResponseEntity.notFound().build();
                }
            }
            
            String content = StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8);
            return ResponseEntity.ok(content);
            
        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                .body("{\"error\": \"Failed to load branding configuration\"}");
        }
    }

    /**
     * Get list of available operators.
     * Returns a simple list of operator IDs that have branding configured.
     */
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getAvailableOperators() {
        // In a real implementation, this would scan the operators directory
        // For now, return known operators
        String operators = "[\"default\", \"alpha-telecom\"]";
        return ResponseEntity.ok(operators);
    }
}
