package com.mytelco.adminbff.offer.model;

import java.util.List;

public record OfferDetailResponse(
    String offerId,
    OfferVersionResponse current,
    List<OfferVersionResponse> history
) {
}
