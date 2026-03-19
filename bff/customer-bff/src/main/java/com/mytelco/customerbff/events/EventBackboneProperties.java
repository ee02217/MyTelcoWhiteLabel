package com.mytelco.customerbff.events;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "mytelco.events")
public class EventBackboneProperties {

    private boolean enabled = true;
    private int maxDeliveredEvents = 2000;

    private final Retry retry = new Retry();
    private final Schema schema = new Schema();
    private final Dispatch dispatch = new Dispatch();

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public int getMaxDeliveredEvents() {
        return maxDeliveredEvents;
    }

    public void setMaxDeliveredEvents(int maxDeliveredEvents) {
        this.maxDeliveredEvents = maxDeliveredEvents;
    }

    public Retry getRetry() {
        return retry;
    }

    public Schema getSchema() {
        return schema;
    }

    public Dispatch getDispatch() {
        return dispatch;
    }

    public static class Retry {

        private int maxAttempts = 3;
        private Duration initialBackoff = Duration.ofMillis(75);
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

    public static class Schema {

        private int defaultVersion = 1;
        private Map<String, Integer> versions = new HashMap<>();

        public int getDefaultVersion() {
            return defaultVersion;
        }

        public void setDefaultVersion(int defaultVersion) {
            this.defaultVersion = defaultVersion;
        }

        public Map<String, Integer> getVersions() {
            return versions;
        }

        public void setVersions(Map<String, Integer> versions) {
            this.versions = versions;
        }
    }

    public static class Dispatch {

        private List<String> failOnTopics = new ArrayList<>();
        private List<String> failOnEventTypes = new ArrayList<>();

        public List<String> getFailOnTopics() {
            return failOnTopics;
        }

        public void setFailOnTopics(List<String> failOnTopics) {
            this.failOnTopics = failOnTopics;
        }

        public List<String> getFailOnEventTypes() {
            return failOnEventTypes;
        }

        public void setFailOnEventTypes(List<String> failOnEventTypes) {
            this.failOnEventTypes = failOnEventTypes;
        }
    }
}
