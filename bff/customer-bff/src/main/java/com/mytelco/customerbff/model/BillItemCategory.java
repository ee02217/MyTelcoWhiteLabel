package com.mytelco.customerbff.model;

import com.fasterxml.jackson.annotation.JsonValue;

public enum BillItemCategory {
    PLAN("plan"),
    ADD_ONS("add-ons"),
    OVERAGES("overages"),
    TAXES("taxes");

    private final String apiValue;

    BillItemCategory(String apiValue) {
        this.apiValue = apiValue;
    }

    @JsonValue
    public String apiValue() {
        return apiValue;
    }
}
