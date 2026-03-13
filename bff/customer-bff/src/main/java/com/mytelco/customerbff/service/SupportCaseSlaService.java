package com.mytelco.customerbff.service;

import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;

@Service
public class SupportCaseSlaService {

    public String slaTargetFor(String category, String priority) {
        Duration target = responseDurationFor(category, priority);
        long hours = target.toHours();
        return "First response within " + hours + "h";
    }

    public Instant expectedResponseAt(Instant createdAt, String category, String priority) {
        return createdAt.plus(responseDurationFor(category, priority));
    }

    private Duration responseDurationFor(String category, String priority) {
        String normalizedPriority = priority == null ? "" : priority.trim().toUpperCase(Locale.ROOT);
        if ("HIGH".equals(normalizedPriority) || "P1".equals(normalizedPriority)) {
            return Duration.ofHours(2);
        }

        String normalizedCategory = category == null ? "" : category.trim().toUpperCase(Locale.ROOT);
        return switch (normalizedCategory) {
            case "OUTAGE" -> Duration.ofHours(4);
            case "BILLING" -> Duration.ofHours(8);
            case "TECHNICAL" -> Duration.ofHours(6);
            default -> Duration.ofHours(12);
        };
    }
}
