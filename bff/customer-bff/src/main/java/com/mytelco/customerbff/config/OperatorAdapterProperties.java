package com.mytelco.customerbff.config;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "mytelco.operator")
public class OperatorAdapterProperties {

    /**
     * Default operator id when no customer override is configured.
     */
    private String defaultOperatorId = "operator-stub-pt";

    /**
     * Optional customer-specific operator routing.
     * key = customerId, value = operatorId
     */
    private Map<String, String> customerOperatorOverrides = new HashMap<>();

    private final Retry retry = new Retry();

    public String getDefaultOperatorId() {
        return defaultOperatorId;
    }

    public void setDefaultOperatorId(String defaultOperatorId) {
        this.defaultOperatorId = defaultOperatorId;
    }

    public Map<String, String> getCustomerOperatorOverrides() {
        return customerOperatorOverrides;
    }

    public void setCustomerOperatorOverrides(Map<String, String> customerOperatorOverrides) {
        this.customerOperatorOverrides = customerOperatorOverrides;
    }

    public Retry getRetry() {
        return retry;
    }

    public static class Retry {

        private int maxAttempts = 3;
        private Duration initialBackoff = Duration.ofMillis(80);
        private double multiplier = 2.0;
        private Duration maxBackoff = Duration.ofSeconds(1);

        public int getMaxAttempts() {
            return maxAttempts;
        }

        public void setMaxAttempts(int maxAttempts) {
            this.maxAttempts = maxAttempts;
        }

        public Duration getInitialBackoff() {
            return initialBackoff;
        }

        public void setInitialBackoff(Duration initialBackoff) {
            this.initialBackoff = initialBackoff;
        }

        public double getMultiplier() {
            return multiplier;
        }

        public void setMultiplier(double multiplier) {
            this.multiplier = multiplier;
        }

        public Duration getMaxBackoff() {
            return maxBackoff;
        }

        public void setMaxBackoff(Duration maxBackoff) {
            this.maxBackoff = maxBackoff;
        }
    }
}
