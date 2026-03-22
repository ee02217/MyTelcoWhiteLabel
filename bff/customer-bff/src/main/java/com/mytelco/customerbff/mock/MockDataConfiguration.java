package com.mytelco.customerbff.mock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * Mock data configuration for development/demo purposes.
 * 
 * Enable with: SPRING_PROFILES_ACTIVE=mock
 * or: docker-compose with profile: mock
 * 
 * WARNING: This should NEVER be enabled in production.
 */
@Profile("mock")
@Configuration
public class MockDataConfiguration {

    @Bean
    public MockCustomerDataProvider mockCustomerDataProvider() {
        return new MockCustomerDataProvider();
    }
}
