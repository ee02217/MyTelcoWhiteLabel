package com.mytelco.customerbff.integration.casebff;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Component
public class CaseBffClient {

    private final RestTemplate restTemplate;
    private final String baseUrl;

    public CaseBffClient(RestTemplate restTemplate, @Value("${case-bff.base-url}") String baseUrl) {
        this.restTemplate = restTemplate;
        this.baseUrl = stripTrailingSlash(baseUrl);
    }

    public TroubleTicketResponse create(String authorizationHeader, TroubleTicketCreateRequest request) {
        return exchange(
            HttpMethod.POST,
            "/api/v1/cases",
            authorizationHeader,
            request,
            TroubleTicketResponse.class,
            true
        );
    }

    public List<TroubleTicketResponse> list(String authorizationHeader) {
        TroubleTicketResponse[] response = exchange(
            HttpMethod.GET,
            "/api/v1/cases",
            authorizationHeader,
            null,
            TroubleTicketResponse[].class,
            false
        );

        if (response == null) {
            return List.of();
        }
        return Arrays.asList(response);
    }

    public TroubleTicketResponse get(String authorizationHeader, String idOrExternalId) {
        return exchange(
            HttpMethod.GET,
            "/api/v1/cases/" + encodePath(idOrExternalId),
            authorizationHeader,
            null,
            TroubleTicketResponse.class,
            false
        );
    }

    public TroubleTicketResponse addEvent(String authorizationHeader, String idOrExternalId, EventRequest request) {
        return exchange(
            HttpMethod.POST,
            "/api/v1/cases/" + encodePath(idOrExternalId) + "/events",
            authorizationHeader,
            request,
            TroubleTicketResponse.class,
            false
        );
    }

    private <T> T exchange(
        HttpMethod method,
        String path,
        String authorizationHeader,
        Object body,
        Class<T> responseType,
        boolean allow201
    ) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        if (authorizationHeader != null && !authorizationHeader.isBlank()) {
            headers.set(HttpHeaders.AUTHORIZATION, authorizationHeader);
        }

        HttpEntity<?> entity = body == null ? new HttpEntity<>(headers) : new HttpEntity<>(body, headers);

        try {
            ResponseEntity<T> response = restTemplate.exchange(baseUrl + path, method, entity, responseType);
            if (response.getStatusCode().is2xxSuccessful() || (allow201 && response.getStatusCode().value() == 201)) {
                return response.getBody();
            }
            return response.getBody();
        } catch (HttpClientErrorException.NotFound notFound) {
            return null;
        }
    }

    private String stripTrailingSlash(String url) {
        if (url == null) {
            return "";
        }
        if (url.endsWith("/")) {
            return url.substring(0, url.length() - 1);
        }
        return url;
    }

    private String encodePath(String value) {
        // Values are UUIDs or external ids like CASE-XXXX; safe for path.
        return value;
    }

    public record TroubleTicketCreateRequest(
        String category,
        String title,
        String description,
        String priority,
        String affectedServiceId
    ) {}

    public record TroubleTicketEventResponse(
        UUID id,
        String eventType,
        String actor,
        String actorType,
        String message,
        java.time.Instant createdAt
    ) {}

    public record TroubleTicketResponse(
        UUID id,
        String externalId,
        String category,
        String title,
        String description,
        String priority,
        String status,
        String customerId,
        String affectedServiceId,
        java.time.Instant slaTarget,
        java.time.Instant expectedResponseAt,
        java.time.Instant resolvedAt,
        java.time.Instant createdAt,
        java.time.Instant updatedAt,
        List<TroubleTicketEventResponse> timeline
    ) {}

    public record EventRequest(String eventType, String message) {}
}
