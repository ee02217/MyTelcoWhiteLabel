package com.mytelco.customerbff.travel;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Service
public class TravelRecommendationService {

    private final Map<String, List<TravelRecommendation>> recommendationsByDestination = Map.of(
        "ES", List.of(
            new TravelRecommendation("ES", "Spain", "ES-5GB-7D", "Spain 5GB Weekly", 5120, 60, 7, BigDecimal.valueOf(9.99), BigDecimal.valueOf(15.00), BigDecimal.valueOf(5.01), true),
            new TravelRecommendation("ES", "Spain", "ES-10GB-14D", "Spain 10GB Bi-Weekly", 10240, 120, 14, BigDecimal.valueOf(14.99), BigDecimal.valueOf(25.00), BigDecimal.valueOf(10.01), false),
            new TravelRecommendation("ES", "Spain", "ES-UNLIMITED-30D", "Spain Unlimited 30 Days", 30720, 500, 30, BigDecimal.valueOf(29.99), BigDecimal.valueOf(50.00), BigDecimal.valueOf(20.01), false)
        ),
        "FR", List.of(
            new TravelRecommendation("FR", "France", "FR-5GB-7D", "France 5GB Weekly", 5120, 60, 7, BigDecimal.valueOf(9.99), BigDecimal.valueOf(15.00), BigDecimal.valueOf(5.01), true),
            new TravelRecommendation("FR", "France", "FR-10GB-14D", "France 10GB Bi-Weekly", 10240, 120, 14, BigDecimal.valueOf(14.99), BigDecimal.valueOf(25.00), BigDecimal.valueOf(10.01), false)
        ),
        "DE", List.of(
            new TravelRecommendation("DE", "Germany", "DE-5GB-7D", "Germany 5GB Weekly", 5120, 60, 7, BigDecimal.valueOf(9.99), BigDecimal.valueOf(15.00), BigDecimal.valueOf(5.01), true),
            new TravelRecommendation("DE", "Germany", "DE-20GB-30D", "Germany 20GB Monthly", 20480, 300, 30, BigDecimal.valueOf(24.99), BigDecimal.valueOf(40.00), BigDecimal.valueOf(15.01), false)
        ),
        "US", List.of(
            new TravelRecommendation("US", "United States", "US-3GB-7D", "USA 3GB Weekly", 3072, 30, 7, BigDecimal.valueOf(14.99), BigDecimal.valueOf(25.00), BigDecimal.valueOf(10.01), true),
            new TravelRecommendation("US", "United States", "US-10GB-30D", "USA 10GB Monthly", 10240, 100, 30, BigDecimal.valueOf(34.99), BigDecimal.valueOf(60.00), BigDecimal.valueOf(25.01), false)
        ),
        "BR", List.of(
            new TravelRecommendation("BR", "Brazil", "BR-2GB-7D", "Brazil 2GB Weekly", 2048, 20, 7, BigDecimal.valueOf(12.99), BigDecimal.valueOf(20.00), BigDecimal.valueOf(7.01), true),
            new TravelRecommendation("BR", "Brazil", "BR-5GB-14D", "Brazil 5GB Bi-Weekly", 5120, 60, 14, BigDecimal.valueOf(19.99), BigDecimal.valueOf(35.00), BigDecimal.valueOf(15.01), false)
        )
    );

    private final Map<String, String> countryNames = Map.of(
        "ES", "Spain", "FR", "France", "DE", "Germany", "US", "United States", "BR", "Brazil",
        "IT", "Italy", "NL", "Netherlands", "BE", "Belgium", "UK", "United Kingdom", "PT", "Portugal"
    );

    public List<TravelRecommendation> getRecommendations(String destination, String currentDataMb) {
        if (destination == null || destination.isBlank()) {
            return new ArrayList<>();
        }

        String destKey = destination.toUpperCase();
        List<TravelRecommendation> packs = recommendationsByDestination.get(destKey);

        if (packs == null) {
            // Generic recommendation for unknown destination
            return List.of(
                new TravelRecommendation(destKey, destKey, "GLOBAL-3GB-7D", "Global 3GB Weekly", 3072, 30, 7, 
                    BigDecimal.valueOf(19.99), BigDecimal.valueOf(30.00), BigDecimal.valueOf(10.01), true)
            );
        }

        return packs;
    }

    public List<TravelRecommendation> getRecommendationsByLine(String lineId) {
        // Simulate based on line ID - randomly pick a destination
        String[] destinations = {"ES", "FR", "DE", "US"};
        String dest = destinations[new Random().nextInt(destinations.length)];
        return getRecommendations(dest, null);
    }

    public String getDestinationName(String code) {
        return countryNames.getOrDefault(code.toUpperCase(), code);
    }
}
