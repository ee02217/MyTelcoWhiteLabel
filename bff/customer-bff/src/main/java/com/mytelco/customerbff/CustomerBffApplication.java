package com.mytelco.customerbff;

import com.mytelco.customerbff.auth.AuthCookieProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

/**
 * Customer BFF - Backend-for-Frontend service for customer-facing endpoints.
 * Provides aggregated data for the customer self-care portal.
 */
@SpringBootApplication
@EnableConfigurationProperties(AuthCookieProperties.class)
public class CustomerBffApplication {

    public static void main(String[] args) {
        SpringApplication.run(CustomerBffApplication.class, args);
    }
}
