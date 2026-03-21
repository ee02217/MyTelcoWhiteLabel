package com.mytelco.customerbff.family;

import com.fasterxml.jackson.annotation.JsonCreator;

import java.util.Locale;

public enum FamilyRole {
    OWNER,
    MANAGER,
    MEMBER;

    @JsonCreator
    public static FamilyRole from(String value) {
        if (value == null) {
            return null;
        }
        try {
            return FamilyRole.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }
}
