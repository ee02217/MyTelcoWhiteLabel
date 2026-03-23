package com.mytelco.customerbff.auth;

import com.mytelco.customerbff.auth.keycloak.InvalidCredentialsException;
import com.mytelco.customerbff.auth.keycloak.KeycloakPasswordGrantClient;
import com.mytelco.customerbff.auth.keycloak.TokenResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "BFF-mediated login via Keycloak token API")
public class AuthController {

    private final KeycloakPasswordGrantClient keycloak;
    private final AuthCookieProperties cookieProps;

    public AuthController(KeycloakPasswordGrantClient keycloak, AuthCookieProperties cookieProps) {
        this.keycloak = keycloak;
        this.cookieProps = cookieProps;
    }

    @PostMapping("/login")
    @Operation(summary = "Login", description = "Authenticate using username/password and set HttpOnly cookies")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request.username() == null || request.username().isBlank() || request.password() == null || request.password().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "username_and_password_required"));
        }

        try {
            TokenResponse tokens = keycloak.passwordGrant(request.username(), request.password());
            return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, buildAccessTokenCookie(tokens.accessToken(), tokens.expiresIn()).toString())
                .header(HttpHeaders.SET_COOKIE, buildRefreshTokenCookie(tokens.refreshToken(), tokens.refreshExpiresIn()).toString())
                .body(Map.of(
                    "authenticated", true,
                    "expiresIn", tokens.expiresIn()
                ));
        } catch (InvalidCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "invalid_credentials"));
        }
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh", description = "Refresh access token using refresh token cookie")
    public ResponseEntity<?> refresh(HttpServletRequest request) {
        String refreshToken = readCookie(request, cookieProps.refreshTokenName());
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "missing_refresh_token"));
        }

        try {
            TokenResponse tokens = keycloak.refresh(refreshToken);
            return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, buildAccessTokenCookie(tokens.accessToken(), tokens.expiresIn()).toString())
                .header(HttpHeaders.SET_COOKIE, buildRefreshTokenCookie(tokens.refreshToken(), tokens.refreshExpiresIn()).toString())
                .body(Map.of(
                    "authenticated", true,
                    "expiresIn", tokens.expiresIn()
                ));
        } catch (InvalidCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "invalid_refresh"));
        }
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout", description = "Clear auth cookies")
    public ResponseEntity<?> logout() {
        ResponseCookie clearAccess = buildAccessTokenCookie("", 0);
        ResponseCookie clearRefresh = buildRefreshTokenCookie("", 0);

        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, clearAccess.toString())
            .header(HttpHeaders.SET_COOKIE, clearRefresh.toString())
            .body(Map.of("authenticated", false));
    }

    @GetMapping("/session")
    @Operation(summary = "Session", description = "Return current authenticated subject + roles")
    public ResponseEntity<?> session(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("{\"authenticated\":false}");
        }
        
        if (!(authentication.getPrincipal() instanceof Jwt jwt)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("{\"authenticated\":false,\"error\":\"Not JWT\"}");
        }

        List<String> roles = extractRoles(jwt);
        String subject = jwt.getSubject();
        String username = jwt.getClaimAsString("preferred_username");
        Long expiresAt = jwt.getExpiresAt() != null ? jwt.getExpiresAt().getEpochSecond() : 0L;
        
        return ResponseEntity.ok("{\"authenticated\":true,\"subject\":\"" + subject + "\",\"username\":\"" + username + "\",\"roles\":" + roles + ",\"expiresAt\":" + expiresAt + "}");
    }

    private ResponseCookie buildAccessTokenCookie(String token, long maxAgeSeconds) {
        var builder = ResponseCookie.from(cookieProps.accessTokenName(), token == null ? "" : token)
            .httpOnly(true)
            .secure(cookieProps.secure())
            .path(cookieProps.path())
            .sameSite(cookieProps.sameSite())
            .maxAge(maxAgeSeconds);
        // Explicitly set empty domain so cookie applies to current host (not localhost)
        builder.domain("");
        return builder.build();
    }

    private ResponseCookie buildRefreshTokenCookie(String token, long maxAgeSeconds) {
        if (token == null || token.isBlank()) {
            // Some deployments disable refresh tokens; keep behavior consistent.
            var builder = ResponseCookie.from(cookieProps.refreshTokenName(), "")
                .httpOnly(true)
                .secure(cookieProps.secure())
                .path(cookieProps.path())
                .sameSite(cookieProps.sameSite())
                .maxAge(0);
            builder.domain("");
            return builder.build();
        }

        var builder = ResponseCookie.from(cookieProps.refreshTokenName(), token)
            .httpOnly(true)
            .secure(cookieProps.secure())
            .path(cookieProps.path())
            .sameSite(cookieProps.sameSite())
            .maxAge(maxAgeSeconds);
        builder.domain("");
        return builder.build();
    }

    private String readCookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) {
            return null;
        }
        for (Cookie cookie : request.getCookies()) {
            if (name.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private List<String> extractRoles(Jwt jwt) {
        Object realmAccess = jwt.getClaim("realm_access");
        if (!(realmAccess instanceof Map<?, ?> realmAccessMap)) {
            return List.of();
        }
        Object roles = realmAccessMap.get("roles");
        if (!(roles instanceof List<?> roleList)) {
            return List.of();
        }
        return roleList.stream().map(String::valueOf).toList();
    }

    public record LoginRequest(String username, String password) {}
}
