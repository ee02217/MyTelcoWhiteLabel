package com.mytelco.customerbff.billing;

public record BillingAddress(
    String addressId,
    String customerId,
    String lineId,
    String type,
    String street,
    String city,
    String state,
    String postalCode,
    String country,
    boolean isDefault,
    String createdAt,
    String updatedAt
) {}
