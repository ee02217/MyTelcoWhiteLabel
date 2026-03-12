package com.mytelco.customerbff.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AlertDedupService {

    private final Map<String, Instant> sentAlerts = new ConcurrentHashMap<>();
    private final Duration dedupWindow;

    public AlertDedupService(@Value("${alerts.dedup.ttl-minutes:360}") long ttlMinutes) {
        this.dedupWindow = Duration.ofMinutes(ttlMinutes);
    }

    public boolean shouldSend(String customerId, String lineId, String service, int threshold) {
        String key = String.join("|", customerId, lineId, service, String.valueOf(threshold));
        Instant now = Instant.now();
        Instant lastSent = sentAlerts.get(key);
        if (lastSent != null && lastSent.plus(dedupWindow).isAfter(now)) {
            return false;
        }

        sentAlerts.put(key, now);
        return true;
    }
}
