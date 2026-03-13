package com.mytelco.customerbff.model.tmf;

import com.fasterxml.jackson.annotation.JsonProperty;

public record TmfProductRef(
    String id,
    String href,
    String name,
    @JsonProperty("@referredType") String referredType
) {}
