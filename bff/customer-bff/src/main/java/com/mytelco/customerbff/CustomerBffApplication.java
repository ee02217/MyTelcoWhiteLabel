package com.mytelco.customerbff;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Customer BFF - Backend-for-Frontend service for customer-facing endpoints.
 * Provides aggregated data for the customer self-care portal.
 */
@SpringBootApplication
public class CustomerBffApplication {

    public static void main(String[] args) {
        SpringApplication.run(CustomerBffApplication.class, args);
    }
}
