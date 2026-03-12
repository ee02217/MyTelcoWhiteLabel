package com.mytelco.customerbff.model;

public enum UsageView {
    DAILY,
    BILLING_CYCLE;

    public static UsageView fromQuery(String value) {
        if (value == null || value.isBlank()) {
            return DAILY;
        }

        return switch (value.trim().toLowerCase()) {
            case "daily" -> DAILY;
            case "billing-cycle", "billing_cycle", "billingcycle" -> BILLING_CYCLE;
            default -> throw new IllegalArgumentException("Unsupported view: " + value);
        };
    }

    public String apiValue() {
        return this == BILLING_CYCLE ? "billing-cycle" : "daily";
    }
}
