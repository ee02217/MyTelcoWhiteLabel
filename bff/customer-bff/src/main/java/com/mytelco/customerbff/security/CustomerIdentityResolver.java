package com.mytelco.customerbff.security;

import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class CustomerIdentityResolver {

    private static final List<String> CUSTOMER_ID_CLAIMS = List.of("customer_id", "customerId", "sub");

    public String resolveCustomerId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Unauthenticated request");
        }

        if (authentication instanceof JwtAuthenticationToken jwtAuthenticationToken) {
            String fromJwt = extractFromJwt(jwtAuthenticationToken.getToken());
            if (StringUtils.hasText(fromJwt)) {
                return fromJwt;
            }
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof Jwt jwt) {
            String fromJwt = extractFromJwt(jwt);
            if (StringUtils.hasText(fromJwt)) {
                return fromJwt;
            }
        }

        String fallbackName = authentication.getName();
        if (StringUtils.hasText(fallbackName) && !"anonymousUser".equalsIgnoreCase(fallbackName)) {
            return fallbackName;
        }

        throw new AccessDeniedException("Unable to resolve customer identity from authentication");
    }

    public void assertSameCustomer(Authentication authentication, String requestedCustomerId) {
        String authenticatedCustomerId = resolveCustomerId(authentication);
        if (!authenticatedCustomerId.equals(requestedCustomerId)) {
            throw new AccessDeniedException("Requested customer is outside authenticated scope");
        }
    }

    private String extractFromJwt(Jwt jwt) {
        for (String claimName : CUSTOMER_ID_CLAIMS) {
            String claimValue = jwt.getClaimAsString(claimName);
            if (StringUtils.hasText(claimValue)) {
                return claimValue;
            }
        }
        return null;
    }
}
