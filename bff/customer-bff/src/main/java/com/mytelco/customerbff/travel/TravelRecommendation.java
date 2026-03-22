package com.mytelco.customerbff.travel;

import java.math.BigDecimal;

public record TravelRecommendation(
    String destination,
    String destinationName,
    String packId,
    String packName,
    int dataMb,
    int voiceMinutes,
    int validityDays,
    BigDecimal priceEur,
    BigDecimal payAsYouGoEur,
    BigDecimal savingsEur,
    boolean recommended
) {}
