package com.mytelco.customerbff.travel;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class InTripControlService {

    private final Map<String, RoamingUsage> usages = new ConcurrentHashMap<>();
    private final Map<String, SpendCap> spendCaps = new ConcurrentHashMap<>();

    public RoamingUsage getUsage(String lineId, String country) {
        String key = lineId + "-" + country;
        RoamingUsage existing = usages.get(key);

        if (existing != null) {
            return existing;
        }

        // Generate mock usage
        long usedMb = new Random().nextInt(5000);
        int usedMin = new Random().nextInt(200);
        int usedSms = new Random().nextInt(50);

        RoamingUsage usage = new RoamingUsage(
            lineId,
            country,
            usedMb,
            usedMin,
            usedSms,
            10240, // 10GB default
            500,
            LocalDate.now().minusDays(7).toString(),
            LocalDate.now().plusDays(7).toString()
        );
        usages.put(key, usage);
        return usage;
    }

    public List<RoamingUsage> getAllUsages(String lineId) {
        return usages.values().stream()
            .filter(u -> u.lineId().equals(lineId))
            .toList();
    }

    public SpendCap getSpendCap(String lineId) {
        return spendCaps.computeIfAbsent(lineId, k -> new SpendCap(
            lineId, BigDecimal.valueOf(50), BigDecimal.valueOf(0), 
            Set.of("WARNING", "CRITICAL"), LocalDate.now().toString()
        ));
    }

    public SpendCap updateSpendCap(String lineId, BigDecimal limit, Set<String> alertTriggers) {
        SpendCap cap = new SpendCap(lineId, limit, BigDecimal.ZERO, alertTriggers, LocalDate.now().toString());
        spendCaps.put(lineId, cap);
        return cap;
    }

    public EmergencyTopupResult purchaseEmergencyTopup(String lineId, BigDecimal amount) {
        String transactionId = "TOPUP-" + System.currentTimeMillis();
        return new EmergencyTopupResult(
            transactionId,
            "SUCCESS",
            amount,
            "€" + amount + " added to your line. Valid for 30 days.",
            LocalDate.now().plusDays(30).toString()
        );
    }
}

record SpendCap(
    String lineId,
    BigDecimal limitEur,
    BigDecimal spentEur,
    Set<String> alertTriggers,
    String updatedAt
) {}

record EmergencyTopupResult(
    String transactionId,
    String status,
    BigDecimal amountEur,
    String message,
    String validUntil
) {}
