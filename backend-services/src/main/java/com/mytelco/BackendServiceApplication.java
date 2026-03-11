package com.mytelco;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main application class for backend service.
 * 
 * To create a new service from this template:
 * 1. Copy the backend-services directory
 * 2. Rename the package (com.mytelco -> com.mytelco.your-service)
 * 3. Update the artifactId in pom.xml
 * 4. Update the service name in application.yml
 */
@SpringBootApplication
public class BackendServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendServiceApplication.class, args);
    }
}
