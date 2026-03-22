package com.mytelco.adminbff.operatormgmt.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mytelco.adminbff.operatormgmt.model.OperatorAuditEntry;
import com.mytelco.adminbff.operatormgmt.model.OperatorBranding;
import com.mytelco.adminbff.operatormgmt.model.OperatorProfileResponse;
import com.mytelco.adminbff.operatormgmt.model.OperatorProfileUpdateRequest;
import com.mytelco.adminbff.operatormgmt.model.OperatorProfileUpdateResponse;
import com.mytelco.adminbff.operatormgmt.model.OperatorSummaryResponse;
import com.mytelco.adminbff.operatormgmt.model.OperatorUserResponse;
import com.mytelco.adminbff.operatormgmt.model.OperatorUserRolesUpdateRequest;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

@Service
public class OperatorManagementService {

    private final ObjectMapper objectMapper;
    private final Path operatorsBasePath;
    private final List<String> defaultLocales;

    private final Map<String, OperatorState> operatorsById = new ConcurrentHashMap<>();

    public OperatorManagementService(
        ObjectMapper objectMapper,
        @Value("${admin.config.operators-path:platform-config/operators}") String operatorsPath,
        @Value("${admin.config.default-locales:en-GB,pt-PT}") List<String> defaultLocales
    ) {
        this.objectMapper = objectMapper;
        this.operatorsBasePath = resolveOperatorsPath(operatorsPath);
        this.defaultLocales = defaultLocales == null || defaultLocales.isEmpty()
            ? List.of("en-GB", "pt-PT")
            : List.copyOf(defaultLocales);
    }

    @PostConstruct
    public void load() {
        try {
            if (!Files.exists(operatorsBasePath)) {
                throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Operators config path not found: " + operatorsBasePath
                );
            }

            try (var stream = Files.list(operatorsBasePath)) {
                stream.filter(Files::isDirectory)
                    .filter(path -> !"schema".equals(path.getFileName().toString()))
                    .forEach(this::loadOperator);
            }
        } catch (IOException ioException) {
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Failed loading operators",
                ioException
            );
        }
    }

    public List<OperatorSummaryResponse> listOperators() {
        return operatorsById.values().stream()
            .map(this::toSummary)
            .sorted(Comparator.comparing(OperatorSummaryResponse::operatorId))
            .toList();
    }

    public OperatorProfileResponse getProfile(String operatorId) {
        OperatorState state = resolve(operatorId);
        synchronized (state) {
            return toProfile(state);
        }
    }

    public OperatorProfileUpdateResponse updateProfile(
        String operatorId,
        OperatorProfileUpdateRequest request,
        String actor
    ) {
        OperatorState state = resolve(operatorId);
        String normalizedActor = normalizeActor(actor);

        synchronized (state) {
            if (request == null
                || (request.name() == null && request.locales() == null && request.featuresByChannel() == null)) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Profile update must include at least one field"
                );
            }

            Map<String, Object> changes = new LinkedHashMap<>();

            if (request.name() != null) {
                String nextName = request.name().trim();
                if (!StringUtils.hasText(nextName)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Profile name cannot be empty");
                }
                if (!nextName.equals(state.name)) {
                    changes.put("name", Map.of("from", state.name, "to", nextName));
                    state.name = nextName;
                }
            }

            if (request.locales() != null) {
                List<String> nextLocales = sanitizeLocales(request.locales());
                if (!nextLocales.equals(state.locales)) {
                    changes.put("locales", Map.of("from", state.locales, "to", nextLocales));
                    state.locales = nextLocales;
                }
            }

            if (request.featuresByChannel() != null) {
                Map<String, Map<String, Boolean>> nextFeatures = sanitizeFeatures(request.featuresByChannel());
                if (!nextFeatures.equals(state.featuresByChannel)) {
                    changes.put("featuresByChannel", "updated");
                    state.featuresByChannel = nextFeatures;
                }
            }

            if (changes.isEmpty()) {
                return new OperatorProfileUpdateResponse(
                    state.operatorId,
                    state.version,
                    normalizedActor,
                    state.updatedAt,
                    toProfile(state)
                );
            }

            state.version += 1;
            state.updatedAt = Instant.now();
            state.auditLog.add(new OperatorAuditEntry(
                state.operatorId,
                "PROFILE",
                state.operatorId,
                "PROFILE_UPDATED",
                normalizedActor,
                state.version,
                state.updatedAt,
                changes
            ));

            return new OperatorProfileUpdateResponse(
                state.operatorId,
                state.version,
                normalizedActor,
                state.updatedAt,
                toProfile(state)
            );
        }
    }

    public List<OperatorUserResponse> listUsers(String operatorId) {
        OperatorState state = resolve(operatorId);
        synchronized (state) {
            return state.usersById.values().stream()
                .map(this::toUser)
                .sorted(Comparator.comparing(OperatorUserResponse::userId))
                .toList();
        }
    }

    public OperatorUserResponse updateUserRoles(
        String operatorId,
        String userId,
        OperatorUserRolesUpdateRequest request,
        String actor
    ) {
        OperatorState state = resolve(operatorId);
        String normalizedActor = normalizeActor(actor);

        synchronized (state) {
            OperatorUserState user = state.usersById.get(userId);
            if (user == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Operator user not found: " + userId);
            }

            Set<String> nextRoles = sanitizeRoles(request.roles());
            boolean nextEnabled = request.enabled() == null ? user.enabled : request.enabled();

            Map<String, Object> changes = new LinkedHashMap<>();
            if (!nextRoles.equals(user.roles)) {
                changes.put("roles", Map.of("from", user.roles, "to", nextRoles));
                user.roles = nextRoles;
            }
            if (nextEnabled != user.enabled) {
                changes.put("enabled", Map.of("from", user.enabled, "to", nextEnabled));
                user.enabled = nextEnabled;
            }

            if (changes.isEmpty()) {
                return toUser(user);
            }

            Instant now = Instant.now();
            user.updatedAt = now;
            state.version += 1;
            state.updatedAt = now;
            state.auditLog.add(new OperatorAuditEntry(
                state.operatorId,
                "USER",
                user.userId,
                "USER_ROLES_UPDATED",
                normalizedActor,
                state.version,
                now,
                changes
            ));

            return toUser(user);
        }
    }

    public List<OperatorAuditEntry> audit(String operatorId, int limit) {
        OperatorState state = resolve(operatorId);
        int boundedLimit = Math.max(1, Math.min(limit, 200));
        synchronized (state) {
            return state.auditLog.stream()
                .sorted(Comparator.comparing(OperatorAuditEntry::timestamp).reversed())
                .limit(boundedLimit)
                .toList();
        }
    }

    public OperatorAuditEntry recordExternalAudit(
        String operatorId,
        String scope,
        String targetId,
        String action,
        String actor,
        Map<String, Object> changes
    ) {
        OperatorState state = resolve(operatorId);
        String normalizedActor = normalizeActor(actor);
        String normalizedScope = StringUtils.hasText(scope) ? scope.trim().toUpperCase(Locale.ROOT) : "UNKNOWN";
        String normalizedAction = StringUtils.hasText(action) ? action.trim().toUpperCase(Locale.ROOT) : "EXTERNAL_EVENT";
        String normalizedTarget = StringUtils.hasText(targetId) ? targetId.trim() : operatorId;

        synchronized (state) {
            Instant now = Instant.now();
            state.version += 1;
            state.updatedAt = now;
            OperatorAuditEntry entry = new OperatorAuditEntry(
                state.operatorId,
                normalizedScope,
                normalizedTarget,
                normalizedAction,
                normalizedActor,
                state.version,
                now,
                changes == null ? Map.of() : changes
            );
            state.auditLog.add(entry);
            return entry;
        }
    }

    private void loadOperator(Path operatorPath) {
        String operatorId = operatorPath.getFileName().toString();

        try {
            Map<String, Object> brandingRaw = objectMapper.readValue(
                operatorPath.resolve("branding/config.json").toFile(),
                new TypeReference<>() {
                }
            );
            Map<String, Object> flagsRaw = objectMapper.readValue(
                operatorPath.resolve("features/flags.json").toFile(),
                new TypeReference<>() {
                }
            );

            String name = asString(brandingRaw.getOrDefault("name", operatorId));
            OperatorBranding branding = parseBranding(brandingRaw);
            Map<String, Map<String, Boolean>> featuresByChannel = parseFlags(flagsRaw);

            long version = asLong(flagsRaw.getOrDefault("version", 1L));
            Instant updatedAt = parseInstant(
                flagsRaw.get("updatedAt"),
                parseInstant(brandingRaw.get("lastUpdated"), Instant.now())
            );

            int journeyCount = countJourneys(operatorPath.resolve("journeys"));
            List<String> locales = parseLocales(brandingRaw.get("locales"));

            OperatorState state = new OperatorState();
            state.operatorId = operatorId;
            state.name = name;
            state.branding = branding;
            state.featuresByChannel = featuresByChannel;
            state.locales = locales;
            state.journeyCount = journeyCount;
            state.version = version;
            state.updatedAt = updatedAt;
            seedUsers(state);

            operatorsById.put(operatorId, state);
        } catch (IOException ioException) {
            throw new IllegalStateException("Failed loading operator metadata for " + operatorId, ioException);
        }
    }

    private OperatorState resolve(String operatorId) {
        OperatorState state = operatorsById.get(operatorId);
        if (state == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Operator not found: " + operatorId);
        }
        return state;
    }

    private OperatorSummaryResponse toSummary(OperatorState state) {
        return new OperatorSummaryResponse(
            state.operatorId,
            state.name,
            state.version,
            state.updatedAt,
            List.copyOf(state.locales),
            state.featuresByChannel.size(),
            state.journeyCount,
            state.usersById.size()
        );
    }

    private OperatorProfileResponse toProfile(OperatorState state) {
        return new OperatorProfileResponse(
            state.operatorId,
            state.name,
            state.branding,
            deepCopyFeatures(state.featuresByChannel),
            List.copyOf(state.locales),
            state.journeyCount,
            state.version,
            state.updatedAt
        );
    }

    private OperatorUserResponse toUser(OperatorUserState user) {
        return new OperatorUserResponse(
            user.userId,
            user.displayName,
            user.email,
            Set.copyOf(user.roles),
            user.enabled,
            user.updatedAt
        );
    }

    private void seedUsers(OperatorState state) {
        Instant now = state.updatedAt;
        state.usersById.put(
            state.operatorId + "-admin",
            new OperatorUserState(
                state.operatorId + "-admin",
                "Operator Admin",
                "admin+" + state.operatorId + "@mytelco.dev",
                new LinkedHashSet<>(Set.of("ADMIN")),
                true,
                now
            )
        );

        state.usersById.put(
            state.operatorId + "-support",
            new OperatorUserState(
                state.operatorId + "-support",
                "Operator Support",
                "support+" + state.operatorId + "@mytelco.dev",
                new LinkedHashSet<>(Set.of("SUPPORT")),
                true,
                now
            )
        );
    }

    @SuppressWarnings("unchecked")
    private OperatorBranding parseBranding(Map<String, Object> brandingRaw) {
        Map<String, Object> logo = (Map<String, Object>) brandingRaw.getOrDefault("logo", Map.of());
        Map<String, Object> colors = (Map<String, Object>) brandingRaw.getOrDefault("colors", Map.of());
        Map<String, Object> primary = (Map<String, Object>) colors.getOrDefault("primary", Map.of());
        Map<String, Object> secondary = (Map<String, Object>) colors.getOrDefault("secondary", Map.of());

        return new OperatorBranding(
            asString(logo.get("light")),
            asString(logo.get("dark")),
            asString(logo.get("favicon")),
            asString(primary.getOrDefault("500", "#0073e6")),
            asString(secondary.getOrDefault("500", "#3b82f6"))
        );
    }

    @SuppressWarnings("unchecked")
    private Map<String, Map<String, Boolean>> parseFlags(Map<String, Object> flagsRaw) {
        Map<String, Object> channels = (Map<String, Object>) flagsRaw.getOrDefault("channels", Map.of());
        Map<String, Map<String, Boolean>> parsed = new LinkedHashMap<>();

        for (Map.Entry<String, Object> channelEntry : channels.entrySet()) {
            Map<String, Object> channelRaw = (Map<String, Object>) channelEntry.getValue();
            Map<String, Object> flags = (Map<String, Object>) channelRaw.getOrDefault("flags", Map.of());
            Map<String, Boolean> booleanFlags = new LinkedHashMap<>();
            for (Map.Entry<String, Object> flag : flags.entrySet()) {
                booleanFlags.put(flag.getKey(), Boolean.TRUE.equals(flag.getValue()));
            }
            parsed.put(channelEntry.getKey(), booleanFlags);
        }

        return parsed;
    }

    private List<String> parseLocales(Object localesRaw) {
        if (localesRaw instanceof List<?> list) {
            List<String> parsed = list.stream()
                .filter(item -> item instanceof String)
                .map(String.class::cast)
                .map(String::trim)
                .filter(StringUtils::hasText)
                .distinct()
                .toList();
            if (!parsed.isEmpty()) {
                return parsed;
            }
        }
        return List.copyOf(defaultLocales);
    }

    private List<String> sanitizeLocales(List<String> locales) {
        if (locales == null) {
            return List.copyOf(defaultLocales);
        }
        List<String> sanitized = locales.stream()
            .filter(item -> item != null)
            .map(String::trim)
            .filter(StringUtils::hasText)
            .distinct()
            .toList();
        if (sanitized.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Locales cannot be empty");
        }
        return sanitized;
    }

    private Set<String> sanitizeRoles(Set<String> roles) {
        if (roles == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Roles are required");
        }
        Set<String> normalized = roles.stream()
            .filter(item -> item != null)
            .map(role -> role.trim().toUpperCase(Locale.ROOT))
            .filter(StringUtils::hasText)
            .collect(Collectors.toCollection(LinkedHashSet::new));

        if (normalized.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Roles cannot be empty");
        }
        return normalized;
    }

    private Map<String, Map<String, Boolean>> sanitizeFeatures(Map<String, Map<String, Boolean>> rawFeatures) {
        if (rawFeatures == null || rawFeatures.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "featuresByChannel cannot be empty");
        }

        Map<String, Map<String, Boolean>> sanitized = new LinkedHashMap<>();
        for (Map.Entry<String, Map<String, Boolean>> channel : rawFeatures.entrySet()) {
            if (!StringUtils.hasText(channel.getKey())) {
                continue;
            }
            Map<String, Boolean> flags = new LinkedHashMap<>();
            if (channel.getValue() != null) {
                for (Map.Entry<String, Boolean> flag : channel.getValue().entrySet()) {
                    if (StringUtils.hasText(flag.getKey())) {
                        flags.put(flag.getKey(), Boolean.TRUE.equals(flag.getValue()));
                    }
                }
            }
            sanitized.put(channel.getKey(), flags);
        }

        if (sanitized.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "featuresByChannel cannot be empty");
        }

        return sanitized;
    }

    private Map<String, Map<String, Boolean>> deepCopyFeatures(Map<String, Map<String, Boolean>> source) {
        Map<String, Map<String, Boolean>> copy = new LinkedHashMap<>();
        source.forEach((channel, flags) -> copy.put(channel, new LinkedHashMap<>(flags)));
        return copy;
    }

    private int countJourneys(Path journeysPath) {
        if (!Files.exists(journeysPath)) {
            return 0;
        }
        try (var stream = Files.list(journeysPath)) {
            return (int) stream.filter(path -> path.toString().endsWith(".json")).count();
        } catch (IOException ignored) {
            return 0;
        }
    }

    private Path resolveOperatorsPath(String configuredPath) {
        Path direct = Path.of(configuredPath);
        if (Files.exists(direct)) {
            return direct;
        }
        Path fallback = Path.of("..", "..", configuredPath);
        return Files.exists(fallback) ? fallback : direct;
    }

    private Instant parseInstant(Object value, Instant fallback) {
        if (value instanceof String stringValue) {
            try {
                return Instant.parse(stringValue);
            } catch (Exception ignored) {
                return fallback;
            }
        }
        return fallback;
    }

    private long asLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        if (value instanceof String stringValue) {
            try {
                return Long.parseLong(stringValue);
            } catch (NumberFormatException ignored) {
                return 1L;
            }
        }
        return 1L;
    }

    private String asString(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private String normalizeActor(String actor) {
        return StringUtils.hasText(actor) ? actor : "system";
    }

    private static class OperatorState {
        String operatorId;
        String name;
        OperatorBranding branding;
        Map<String, Map<String, Boolean>> featuresByChannel;
        List<String> locales;
        int journeyCount;
        long version;
        Instant updatedAt;
        Map<String, OperatorUserState> usersById = new LinkedHashMap<>();
        List<OperatorAuditEntry> auditLog = new CopyOnWriteArrayList<>();
    }

    private static class OperatorUserState {
        String userId;
        String displayName;
        String email;
        Set<String> roles;
        boolean enabled;
        Instant updatedAt;

        OperatorUserState(
            String userId,
            String displayName,
            String email,
            Set<String> roles,
            boolean enabled,
            Instant updatedAt
        ) {
            this.userId = userId;
            this.displayName = displayName;
            this.email = email;
            this.roles = roles;
            this.enabled = enabled;
            this.updatedAt = updatedAt;
        }
    }
}
