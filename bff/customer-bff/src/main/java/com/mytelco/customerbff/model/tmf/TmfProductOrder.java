package com.mytelco.customerbff.model.tmf;

import com.fasterxml.jackson.annotation.JsonProperty;

public record TmfProductOrder(
    String id,
    String href,
    String externalId,
    String state,
    TmfProductOrderItem productOrderItem,
    @JsonProperty("@type") String type
) {}
