package com.mytelco.customerbff.family.controls;

import com.fasterxml.jackson.annotation.JsonCreator;

import java.util.Locale;

public enum SharedControlCategory {
    DATA_MB("MB"),
    VOICE_MIN("MIN"),
    SMS_COUNT("SMS"),
    SPEND_EUR("EUR"),
    ADDON_PURCHASES("UNITS");

    private final String unit;

    SharedControlCategory(String unit) {
        this.unit = unit;
    }

    public String unit() {
        return unit;
    }

    @JsonCreator
    public static SharedControlCategory from(String value) {
        if (value == null) {
            return null;
        }
        try {
            return SharedControlCategory.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }
}
