package com.mytelco.customerbff.model.tmf;

import com.fasterxml.jackson.annotation.JsonProperty;

public record TmfRelatedParty(
    String id,
    String role,
    String name,
    @JsonProperty("@referredType") String referredType
) {}
