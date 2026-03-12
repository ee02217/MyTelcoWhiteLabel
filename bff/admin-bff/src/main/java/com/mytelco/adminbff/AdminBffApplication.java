package com.mytelco.adminbff;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Admin BFF - Backend-for-Frontend service for admin-facing endpoints.
 * Provides aggregated data for the admin management portal.
 */
@SpringBootApplication
public class AdminBffApplication {

    public static void main(String[] args) {
        SpringApplication.run(AdminBffApplication.class, args);
    }
}
