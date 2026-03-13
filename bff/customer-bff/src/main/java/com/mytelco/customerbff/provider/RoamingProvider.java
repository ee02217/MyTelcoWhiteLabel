package com.mytelco.customerbff.provider;

import com.mytelco.customerbff.model.RoamingPack;
import com.mytelco.customerbff.model.RoamingPackPurchaseResponse;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RoamingProvider {

    private final Map<String, Integer> lineAllowance = new ConcurrentHashMap<>();

    public List<RoamingPack> listPacks(String country) {
        String normalized = country.toUpperCase(Locale.ROOT);
        return List.of(
            new RoamingPack("pack-weekly-1gb", normalized, "Roaming 1GB / 7 days", 1, 7, new BigDecimal("4.99"), "EUR"),
            new RoamingPack("pack-weekly-3gb", normalized, "Roaming 3GB / 7 days", 3, 7, new BigDecimal("9.99"), "EUR")
        );
    }

    public RoamingPackPurchaseResponse purchase(String lineId, String country, RoamingPack pack) {
        int totalAllowance = lineAllowance.getOrDefault(lineId, 0) + pack.allowanceGb();
        lineAllowance.put(lineId, totalAllowance);

        LocalDate from = LocalDate.now();
        LocalDate until = from.plusDays(pack.validityDays());
        return new RoamingPackPurchaseResponse(lineId, country.toUpperCase(Locale.ROOT), pack.packId(), totalAllowance, from, until, "PURCHASED");
    }
}
