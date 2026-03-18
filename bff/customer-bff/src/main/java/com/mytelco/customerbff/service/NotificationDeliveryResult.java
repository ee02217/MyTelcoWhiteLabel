package com.mytelco.customerbff.service;

public record NotificationDeliveryResult(
    boolean delivered,
    String provider,
    String providerReference,
    String errorCode,
    String errorMessage
) {

    public static NotificationDeliveryResult delivered(String provider, String providerReference) {
        return new NotificationDeliveryResult(true, provider, providerReference, null, null);
    }

    public static NotificationDeliveryResult failed(String provider, String errorCode, String errorMessage) {
        return new NotificationDeliveryResult(false, provider, null, errorCode, errorMessage);
    }
}
