package com.mytelco.customerbff.model.tmf;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record TmfProductOffering(
    String id,
    String href,
    String name,
    String description,
    String lifecycleStatus,
    List<TmfMoney> price,
    @JsonProperty("@type") String type
) {}
