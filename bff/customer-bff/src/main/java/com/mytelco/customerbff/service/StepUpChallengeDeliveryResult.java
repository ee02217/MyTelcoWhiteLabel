package com.mytelco.customerbff.service;

public record StepUpChallengeDeliveryResult(
    String channel,
    String maskedDestination,
    String providerReference
) {}
