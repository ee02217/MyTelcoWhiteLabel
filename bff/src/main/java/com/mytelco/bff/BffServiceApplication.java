package com.mytelco.bff;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main application class for BFF (Backend-for-Frontend) service.
 * 
 * The BFF aggregates data from multiple backend services and provides
 * a simplified API for frontend applications.
 * 
 * To create a new BFF from this template:
 * 1. Copy the bff directory
 * 2. Rename the package (com.mytelco.bff -> com.mytelco.bff.your-bff)
 * 3. Update the artifactId in pom.xml
 * 4. Update the service name in application.yml
 */
@SpringBootApplication
public class BffServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(BffServiceApplication.class, args);
    }
}
