package com.mytelco.customerbff.model;

/**
 * Represents an active customer line in the account overview.
 */
public record ActiveLine(
    String lineId,
    String msisdn,
    String nickname,
    String status
) {}
