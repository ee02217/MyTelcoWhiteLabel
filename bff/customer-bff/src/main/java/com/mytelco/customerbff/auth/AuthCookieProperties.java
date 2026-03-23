package com.mytelco.customerbff.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.auth.cookies")
public record AuthCookieProperties(
    String accessTokenName,
    String refreshTokenName,
    String sameSite,
    boolean secure,
    String path
) {
    public AuthCookieProperties {
        accessTokenName = accessTokenName == null || accessTokenName.isBlank() ? "MYTELCO_ACCESS_TOKEN" : accessTokenName;
        refreshTokenName = refreshTokenName == null || refreshTokenName.isBlank() ? "MYTELCO_REFRESH_TOKEN" : refreshTokenName;
        sameSite = sameSite == null || sameSite.isBlank() ? "Lax" : sameSite;
        path = path == null || path.isBlank() ? "/" : path;
    }
}
