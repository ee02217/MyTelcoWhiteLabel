package com.mytelco.customerbff.auth.keycloak;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
public class KeycloakPasswordGrantClient {

    private final RestTemplate restTemplate;
    private final String issuerUri;
    private final String clientId;
    private final String clientSecret;
    private final String scope;

    public KeycloakPasswordGrantClient(
        RestTemplate restTemplate,
        @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}") String issuerUri,
        @Value("${app.auth.oidc.client-id:web-portal}") String clientId,
        @Value("${app.auth.oidc.client-secret:}") String clientSecret,
        @Value("${app.auth.oidc.scope:openid roles}") String scope
    ) {
        this.restTemplate = restTemplate;
        this.issuerUri = stripTrailingSlash(issuerUri);
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.scope = scope;
    }

    public TokenResponse passwordGrant(String username, String password) {
        String tokenUrl = issuerUri + "/protocol/openid-connect/token";

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "password");
        form.add("client_id", clientId);
        if (clientSecret != null && !clientSecret.isBlank()) {
            form.add("client_secret", clientSecret);
        }
        form.add("username", username);
        form.add("password", password);
        form.add("scope", scope);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        try {
            Map<?, ?> json = restTemplate.postForObject(tokenUrl, new HttpEntity<>(form, headers), Map.class);
            if (json == null) {
                throw new RuntimeException("Empty token response");
            }

            return TokenResponse.from(json);
        } catch (HttpClientErrorException.Unauthorized e) {
            throw new InvalidCredentialsException();
        } catch (HttpClientErrorException.BadRequest e) {
            // Keycloak returns 400 for invalid_grant on bad credentials.
            if (e.getResponseBodyAsString() != null && e.getResponseBodyAsString().contains("invalid_grant")) {
                throw new InvalidCredentialsException();
            }
            throw e;
        }
    }

    public TokenResponse refresh(String refreshToken) {
        String tokenUrl = issuerUri + "/protocol/openid-connect/token";

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "refresh_token");
        form.add("client_id", clientId);
        if (clientSecret != null && !clientSecret.isBlank()) {
            form.add("client_secret", clientSecret);
        }
        form.add("refresh_token", refreshToken);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        try {
            Map<?, ?> json = restTemplate.postForObject(tokenUrl, new HttpEntity<>(form, headers), Map.class);
            if (json == null) {
                throw new RuntimeException("Empty token response");
            }

            return TokenResponse.from(json);
        } catch (HttpClientErrorException.Unauthorized e) {
            throw new InvalidCredentialsException();
        } catch (HttpClientErrorException.BadRequest e) {
            if (e.getResponseBodyAsString() != null && e.getResponseBodyAsString().contains("invalid_grant")) {
                throw new InvalidCredentialsException();
            }
            throw e;
        }
    }

    private String stripTrailingSlash(String value) {
        if (value == null) return "";
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
