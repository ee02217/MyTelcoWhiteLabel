package com.mytelco.customerbff.auth.keycloak;

import java.util.Map;

public record TokenResponse(
    String accessToken,
    String refreshToken,
    String idToken,
    long expiresIn,
    long refreshExpiresIn,
    String tokenType,
    String scope
) {

    public static TokenResponse from(Map<?, ?> json) {
        return new TokenResponse(
            string(json.get("access_token")),
            string(json.get("refresh_token")),
            string(json.get("id_token")),
            longValue(json.get("expires_in")),
            longValue(json.get("refresh_expires_in")),
            string(json.get("token_type")),
            string(json.get("scope"))
        );
    }

    private static String string(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private static long longValue(Object value) {
        if (value == null) return 0L;
        if (value instanceof Number n) return n.longValue();
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (NumberFormatException e) {
            return 0L;
        }
    }
}
