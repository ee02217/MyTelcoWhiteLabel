package com.mytelco.adminbff.offer.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mytelco.adminbff.offer.model.OfferDetailResponse;
import com.mytelco.adminbff.offer.model.OfferState;
import com.mytelco.adminbff.offer.model.OfferSummaryResponse;
import com.mytelco.adminbff.offer.model.OfferUpdateRequest;
import com.mytelco.adminbff.offer.model.OfferVersionResponse;
import com.mytelco.adminbff.operatormgmt.service.OperatorManagementService;
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
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OfferManagementService {

    private final ObjectMapper objectMapper;
    private final Path operatorsBasePath;
    private final OperatorManagementService operatorManagementService;

    private final Map<String, Map<String, OfferItemState>> offerIndex = new ConcurrentHashMap<>();

    public OfferManagementService(
        ObjectMapper objectMapper,
        OperatorManagementService operatorManagementService,
        @Value("${admin.config.operators-path:platform-config/operators}") String operatorsPath
    ) {
        this.objectMapper = objectMapper;
        this.operatorManagementService = operatorManagementService;
        this.operatorsBasePath = resolveOperatorsPath(operatorsPath);
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
                    .forEach(this::loadOperatorOffers);
            }
        } catch (IOException ioException) {
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Failed loading offer metadata",
                ioException
            );
        }
    }

    public List<OfferSummaryResponse> listOffers(String operatorId) {
        ensureOperatorExists(operatorId);
        Map<String, OfferItemState> operatorOffers = offerIndex.get(operatorId);
        if (operatorOffers == null || operatorOffers.isEmpty()) {
            return List.of();
        }

        return operatorOffers.values().stream()
            .map(this::toSummary)
            .sorted(Comparator.comparing(OfferSummaryResponse::offerId))
            .toList();
    }

    public OfferDetailResponse getOffer(String operatorId, String offerId, Integer version) {
        OfferItemState item = resolveOffer(operatorId, offerId, false);

        synchronized (item) {
            if (item.history.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Offer has no versions: " + offerId);
            }

            OfferVersion target = selectVersion(item.history, version);
            List<OfferVersionResponse> responseHistory = item.history.stream()
                .sorted(Comparator.comparingInt(OfferVersion::version).reversed())
                .map(this::toResponse)
                .toList();

            return new OfferDetailResponse(item.offerId, toResponse(target), responseHistory);
        }
    }

    public OfferVersionResponse updateOffer(
        String operatorId,
        String offerId,
        OfferUpdateRequest request,
        String actor
    ) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Offer payload is required");
        }

        OfferItemState item = resolveOffer(operatorId, offerId, true);
        String normalizedActor = normalizeActor(actor);

        synchronized (item) {
            OfferVersion current = latest(item.history);

            String nextName = request.name() != null
                ? sanitizeText(request.name(), "name")
                : (current != null ? current.name() : null);
            if (!StringUtils.hasText(nextName)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required");
            }

            String nextDescription = request.description() != null
                ? sanitizeText(request.description(), "description")
                : (current != null ? current.description() : "");

            Map<String, Object> nextEligibilityRules = request.eligibilityRules() != null
                ? sanitizeEligibilityRules(request.eligibilityRules())
                : (current != null ? deepCopyMap(current.eligibilityRules()) : Map.of());

            List<String> nextVisibleChannels = request.visibleChannels() != null
                ? sanitizeVisibleChannels(request.visibleChannels())
                : (current != null ? List.copyOf(current.visibleChannels()) : List.of("web"));

            OfferState nextState = request.state() != null
                ? request.state()
                : (current != null ? current.state() : OfferState.DRAFT);

            if (current != null) {
                ensureAllowedTransition(current.state(), nextState);
            }

            String nextNotes = StringUtils.hasText(request.notes()) ? request.notes().trim() : null;
            String nextReviewer = request.reviewer() != null
                ? normalizeOptionalText(request.reviewer())
                : (current != null ? current.reviewer() : null);

            int nextVersion = current == null
                ? 1
                : item.history.stream().mapToInt(OfferVersion::version).max().orElse(current.version()) + 1;

            Instant now = Instant.now();
            OfferVersion next = new OfferVersion(
                item.offerId,
                nextVersion,
                nextState,
                nextName,
                nextDescription,
                nextEligibilityRules,
                nextVisibleChannels,
                nextNotes,
                normalizedActor,
                nextReviewer,
                now
            );

            item.history.add(next);
            item.updatedAt = now;

            String action;
            if (current == null) {
                action = "OFFER_CREATED";
            } else if (current.state() != nextState) {
                action = "OFFER_STATE_TRANSITIONED";
            } else {
                action = "OFFER_UPDATED";
            }

            operatorManagementService.recordExternalAudit(
                operatorId,
                "OFFER",
                item.offerId,
                action,
                normalizedActor,
                buildChanges(current, next)
            );

            return toResponse(next);
        }
    }

    private Map<String, Object> buildChanges(OfferVersion from, OfferVersion to) {
        Map<String, Object> changes = new LinkedHashMap<>();
        changes.put("version", Map.of(
            "from", from == null ? null : from.version(),
            "to", to.version()
        ));

        if (from == null || !from.state().equals(to.state())) {
            changes.put("state", Map.of(
                "from", from == null ? null : from.state(),
                "to", to.state()
            ));
        }
        if (from == null || !from.name().equals(to.name())) {
            changes.put("name", Map.of(
                "from", from == null ? null : from.name(),
                "to", to.name()
            ));
        }
        if (from == null || !from.description().equals(to.description())) {
            changes.put("description", Map.of(
                "from", from == null ? null : from.description(),
                "to", to.description()
            ));
        }
        if (from == null || !from.visibleChannels().equals(to.visibleChannels())) {
            changes.put("visibleChannels", Map.of(
                "from", from == null ? null : from.visibleChannels(),
                "to", to.visibleChannels()
            ));
        }
        if (from == null || !from.eligibilityRules().equals(to.eligibilityRules())) {
            changes.put("eligibilityRules", Map.of(
                "from", from == null ? null : from.eligibilityRules(),
                "to", to.eligibilityRules()
            ));
        }

        return changes;
    }

    private OfferSummaryResponse toSummary(OfferItemState item) {
        OfferVersion latest = latest(item.history);
        if (latest == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Offer has no versions: " + item.offerId);
        }

        return new OfferSummaryResponse(
            latest.offerId(),
            latest.version(),
            latest.state(),
            latest.name(),
            List.copyOf(latest.visibleChannels()),
            deepCopyMap(latest.eligibilityRules()),
            latest.author(),
            latest.reviewer(),
            latest.updatedAt()
        );
    }

    private OfferVersionResponse toResponse(OfferVersion version) {
        return new OfferVersionResponse(
            version.offerId(),
            version.version(),
            version.state(),
            version.name(),
            version.description(),
            deepCopyMap(version.eligibilityRules()),
            List.copyOf(version.visibleChannels()),
            version.notes(),
            version.author(),
            version.reviewer(),
            version.updatedAt()
        );
    }

    private OfferVersion latest(List<OfferVersion> history) {
        return history.stream().max(Comparator.comparingInt(OfferVersion::version)).orElse(null);
    }

    private OfferVersion selectVersion(List<OfferVersion> history, Integer version) {
        if (version == null) {
            OfferVersion latest = latest(history);
            if (latest == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Offer version not found");
            }
            return latest;
        }

        return history.stream()
            .filter(entry -> entry.version() == version)
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Offer version not found: " + version
            ));
    }

    private OfferItemState resolveOffer(String operatorId, String offerId, boolean createIfMissing) {
        ensureOperatorExists(operatorId);
        String sanitizedOfferId = sanitizeOfferId(offerId);

        Map<String, OfferItemState> operatorOffers = offerIndex.computeIfAbsent(
            operatorId,
            key -> new ConcurrentHashMap<>()
        );

        OfferItemState existing = operatorOffers.get(sanitizedOfferId);
        if (existing != null) {
            return existing;
        }
        if (!createIfMissing) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Offer not found: " + sanitizedOfferId);
        }

        OfferItemState created = new OfferItemState(sanitizedOfferId);
        operatorOffers.put(sanitizedOfferId, created);
        return created;
    }

    private void ensureAllowedTransition(OfferState from, OfferState to) {
        if (from == null || to == null || from == to) {
            return;
        }

        boolean allowed = switch (from) {
            case DRAFT -> to == OfferState.APPROVAL || to == OfferState.RETIRED;
            case APPROVAL -> to == OfferState.DRAFT || to == OfferState.PUBLISHED || to == OfferState.RETIRED;
            case PUBLISHED -> to == OfferState.RETIRED || to == OfferState.APPROVAL;
            case RETIRED -> to == OfferState.DRAFT;
        };

        if (!allowed) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Invalid state transition: " + from + " -> " + to
            );
        }
    }

    private void loadOperatorOffers(Path operatorPath) {
        String operatorId = operatorPath.getFileName().toString();
        Path offersDir = operatorPath.resolve("offers");
        if (!Files.exists(offersDir) || !Files.isDirectory(offersDir)) {
            return;
        }

        try (var stream = Files.list(offersDir)) {
            stream.filter(path -> path.toString().endsWith(".json"))
                .forEach(path -> loadOfferFile(operatorId, path));
        } catch (IOException ioException) {
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Failed loading offers for operator: " + operatorId,
                ioException
            );
        }
    }

    private void loadOfferFile(String operatorId, Path filePath) {
        try {
            OfferFileDto file = objectMapper.readValue(filePath.toFile(), OfferFileDto.class);
            if (!StringUtils.hasText(file.offerId())) {
                return;
            }

            String offerId = sanitizeOfferId(file.offerId());
            OfferItemState state = new OfferItemState(offerId, parseInstant(file.updatedAt(), Instant.now()));
            List<OfferVersionDto> versions = file.versions() == null ? List.of() : file.versions();

            for (OfferVersionDto dto : versions) {
                if (dto.version() < 1) {
                    continue;
                }
                OfferVersion version = new OfferVersion(
                    offerId,
                    dto.version(),
                    dto.state() == null ? OfferState.DRAFT : dto.state(),
                    StringUtils.hasText(dto.name()) ? dto.name().trim() : "",
                    StringUtils.hasText(dto.description()) ? dto.description().trim() : "",
                    sanitizeEligibilityRules(dto.eligibilityRules()),
                    sanitizeVisibleChannels(dto.visibleChannels()),
                    normalizeOptionalText(dto.notes()),
                    StringUtils.hasText(dto.author()) ? dto.author().trim() : "system",
                    normalizeOptionalText(dto.reviewer()),
                    parseInstant(dto.updatedAt(), state.updatedAt)
                );
                state.history.add(version);
                if (version.updatedAt().isAfter(state.updatedAt)) {
                    state.updatedAt = version.updatedAt();
                }
            }

            if (!state.history.isEmpty()) {
                offerIndex.computeIfAbsent(operatorId, key -> new ConcurrentHashMap<>()).put(offerId, state);
            }
        } catch (IOException ioException) {
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Failed reading offer file: " + filePath,
                ioException
            );
        }
    }

    private void ensureOperatorExists(String operatorId) {
        Path operatorPath = operatorsBasePath.resolve(operatorId);
        if (!Files.exists(operatorPath)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Operator not found: " + operatorId);
        }
    }

    private String normalizeActor(String actor) {
        return StringUtils.hasText(actor) ? actor.trim() : "system";
    }

    private String sanitizeOfferId(String offerId) {
        if (!StringUtils.hasText(offerId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "offerId is required");
        }
        String trimmed = offerId.trim();
        if (!trimmed.matches("[a-z0-9-]+")) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "offerId must be kebab-case ([a-z0-9-]+)"
            );
        }
        return trimmed;
    }

    private String sanitizeText(String value, String fieldName) {
        if (!StringUtils.hasText(value)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " cannot be empty");
        }
        return value.trim();
    }

    private String normalizeOptionalText(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private List<String> sanitizeVisibleChannels(List<String> channels) {
        if (channels == null) {
            return List.of();
        }
        List<String> cleaned = channels.stream()
            .filter(StringUtils::hasText)
            .map(value -> value.trim().toLowerCase(Locale.ROOT))
            .distinct()
            .toList();

        if (cleaned.isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "visibleChannels must include at least one channel"
            );
        }

        return cleaned;
    }

    private Map<String, Object> sanitizeEligibilityRules(Map<String, Object> rules) {
        if (rules == null || rules.isEmpty()) {
            return Map.of();
        }

        Map<String, Object> cleaned = new LinkedHashMap<>();
        rules.forEach((key, value) -> {
            if (StringUtils.hasText(key)) {
                cleaned.put(key.trim(), value);
            }
        });
        return cleaned;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> deepCopyMap(Map<String, Object> source) {
        if (source == null || source.isEmpty()) {
            return Map.of();
        }
        return objectMapper.convertValue(source, Map.class);
    }

    private Instant parseInstant(String value, Instant fallback) {
        if (!StringUtils.hasText(value)) {
            return fallback;
        }
        try {
            return Instant.parse(value);
        } catch (Exception ignored) {
            return fallback;
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

    private static class OfferItemState {
        private final String offerId;
        private final List<OfferVersion> history = new ArrayList<>();
        private Instant updatedAt;

        OfferItemState(String offerId) {
            this(offerId, Instant.now());
        }

        OfferItemState(String offerId, Instant updatedAt) {
            this.offerId = offerId;
            this.updatedAt = updatedAt;
        }
    }

    private record OfferVersion(
        String offerId,
        int version,
        OfferState state,
        String name,
        String description,
        Map<String, Object> eligibilityRules,
        List<String> visibleChannels,
        String notes,
        String author,
        String reviewer,
        Instant updatedAt
    ) {
    }

    private record OfferFileDto(
        String offerId,
        String operatorId,
        String updatedAt,
        List<OfferVersionDto> versions
    ) {
    }

    private record OfferVersionDto(
        int version,
        OfferState state,
        String name,
        String description,
        Map<String, Object> eligibilityRules,
        List<String> visibleChannels,
        String notes,
        String author,
        String reviewer,
        String updatedAt
    ) {
    }
}
