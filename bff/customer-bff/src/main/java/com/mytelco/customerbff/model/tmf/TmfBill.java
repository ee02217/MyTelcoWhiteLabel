package com.mytelco.customerbff.model.tmf;

import com.fasterxml.jackson.annotation.JsonProperty;

public record TmfBill(
    String id,
    String href,
    String state,
    TmfMoney amountDue,
    String paymentDueDate,
    @JsonProperty("@type") String type
) {}
