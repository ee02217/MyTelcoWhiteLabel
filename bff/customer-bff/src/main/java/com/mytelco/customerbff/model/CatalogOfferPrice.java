package com.mytelco.customerbff.model;

import java.math.BigDecimal;

public record CatalogOfferPrice(
    BigDecimal amount,
    String currency
) {
}
