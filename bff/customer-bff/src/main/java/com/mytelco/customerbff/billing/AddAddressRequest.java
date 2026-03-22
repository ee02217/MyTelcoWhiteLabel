package com.mytelco.customerbff.billing;

public record AddAddressRequest(
    String lineId,
    String type,
    String street,
    String city,
    String state,
    String postalCode,
    String country
) {}
