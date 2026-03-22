package com.mytelco.customerbff.family.controls;

public record SharedControlOverrideDecisionRequest(
    boolean approve,
    String note
) {
}
