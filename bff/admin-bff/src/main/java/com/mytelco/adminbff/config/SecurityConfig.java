package com.mytelco.adminbff.config;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@ConditionalOnProperty(name = "app.security.dev-mode", havingValue = "false", matchIfMissing = true)
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Value("${app.security.dev-mode:false}")
    private boolean devMode;

    private static final OAuth2Error INVALID_ISSUER_REALM_ERROR = new OAuth2Error(
        "invalid_token",
        "Issuer claim does not match expected realm path",
        null
    );

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(authorize -> {
                if (devMode) {
                    // In dev mode, permit all admin endpoints
                    authorize
                        .requestMatchers("/actuator/health/**", "/actuator/info", "/actuator/metrics/**", "/actuator/prometheus")
                        .permitAll()
                        .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/api-docs/**", "/v3/api-docs/**")
                        .permitAll()
                        .requestMatchers("/api/v1/admin/**")
                        .permitAll()
                        .anyRequest().authenticated();
                } else {
                    authorize
                        .requestMatchers("/actuator/health/**", "/actuator/info", "/actuator/metrics/**", "/actuator/prometheus")
                        .permitAll()
                        .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/api-docs/**", "/v3/api-docs/**")
                        .permitAll()
                        .requestMatchers("/api/v1/admin/**").hasAnyRole("ADMIN", "SUPPORT")
                        .anyRequest().authenticated();
                }
            })
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())));

        return http.build();
    }

    @Bean
    public JwtDecoder jwtDecoder(
        @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri}") String jwkSetUri,
        @Value("${app.security.jwt.expected-realm-path:/realms/mytelco-white-label}") String expectedRealmPath
    ) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();

        OAuth2TokenValidator<Jwt> defaultValidator = JwtValidators.createDefault();
        OAuth2TokenValidator<Jwt> issuerRealmPathValidator =
            jwt -> validateIssuerRealmPath(jwt, expectedRealmPath);

        decoder.setJwtValidator(
            new DelegatingOAuth2TokenValidator<>(defaultValidator, issuerRealmPathValidator)
        );
        return decoder;
    }

    private OAuth2TokenValidatorResult validateIssuerRealmPath(Jwt jwt, String expectedRealmPath) {
        if (jwt.getIssuer() == null) {
            return OAuth2TokenValidatorResult.failure(INVALID_ISSUER_REALM_ERROR);
        }

        String normalizedExpected = normalizePath(expectedRealmPath);
        String normalizedIssuerPath = normalizePath(jwt.getIssuer().getPath());

        if (normalizedExpected.equals(normalizedIssuerPath)) {
            return OAuth2TokenValidatorResult.success();
        }

        return OAuth2TokenValidatorResult.failure(INVALID_ISSUER_REALM_ERROR);
    }

    private String normalizePath(String path) {
        if (path == null || path.isBlank()) {
            return "";
        }
        if (path.length() > 1 && path.endsWith("/")) {
            return path.substring(0, path.length() - 1);
        }
        return path;
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        final boolean isDevMode = devMode;
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            if (isDevMode) {
                // In dev mode, grant ADMIN role to all authenticated requests
                return List.of(new SimpleGrantedAuthority("ROLE_ADMIN"));
            }
            return extractRealmRoleAuthorities(jwt);
        });
        return converter;
    }

    @SuppressWarnings("unchecked")
    private Collection<GrantedAuthority> extractRealmRoleAuthorities(Jwt jwt) {
        Object realmAccessObj = jwt.getClaim("realm_access");
        if (!(realmAccessObj instanceof Map<?, ?> realmAccess)) {
            return List.of();
        }

        Object rolesObj = realmAccess.get("roles");
        if (!(rolesObj instanceof Collection<?> roles)) {
            return List.of();
        }

        List<GrantedAuthority> authorities = new ArrayList<>();
        for (Object role : roles) {
            if (role instanceof String roleName && !roleName.isBlank()) {
                authorities.add(new SimpleGrantedAuthority("ROLE_" + roleName));
            }
        }
        return authorities;
    }
}
