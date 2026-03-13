package com.mytelco.customerbff.model.tmf;

import com.fasterxml.jackson.annotation.JsonProperty;

public record TmfAccount(
    String id,
    String href,
    String name,
    String status,
    TmfRelatedParty relatedParty,
    @JsonProperty("@type") String type
) {}
