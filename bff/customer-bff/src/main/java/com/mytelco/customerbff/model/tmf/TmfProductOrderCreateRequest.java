package com.mytelco.customerbff.model.tmf;

public record TmfProductOrderCreateRequest(
    String externalId,
    String lineId,
    String itemType,
    String productOfferingId,
    Boolean simulateFailure
) {}
