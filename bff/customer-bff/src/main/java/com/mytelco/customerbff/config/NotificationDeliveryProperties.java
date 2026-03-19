package com.mytelco.customerbff.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "mytelco.notifications")
public class NotificationDeliveryProperties {

    private boolean testSendEnabled = true;
    private final Delivery delivery = new Delivery();

    public boolean isTestSendEnabled() {
        return testSendEnabled;
    }

    public void setTestSendEnabled(boolean testSendEnabled) {
        this.testSendEnabled = testSendEnabled;
    }

    public Delivery getDelivery() {
        return delivery;
    }

    public static class Delivery {

        private String provider = "stub";
        private int maxAttempts = 3;
        private Duration retryBackoff = Duration.ofSeconds(1);
        private String webhookUrl;

        public String getProvider() {
            return provider;
        }

        public void setProvider(String provider) {
            this.provider = provider;
        }

        public int getMaxAttempts() {
            return maxAttempts;
        }

        public void setMaxAttempts(int maxAttempts) {
            this.maxAttempts = maxAttempts;
        }

        public Duration getRetryBackoff() {
            return retryBackoff;
        }

        public void setRetryBackoff(Duration retryBackoff) {
            this.retryBackoff = retryBackoff;
        }

        public String getWebhookUrl() {
            return webhookUrl;
        }

        public void setWebhookUrl(String webhookUrl) {
            this.webhookUrl = webhookUrl;
        }
    }
}
