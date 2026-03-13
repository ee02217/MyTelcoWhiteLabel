package com.mytelco.customerbff.model;

import java.util.List;

public record CatalogResponse(
    String lineId,
    String operatorId,
    List<CatalogOffer> offers
) {
}
