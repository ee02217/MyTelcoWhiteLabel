package com.mytelco.adminbff.content.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mytelco.adminbff.content.model.ContentLocaleResponse;
import com.mytelco.adminbff.content.model.ContentLocaleSummary;
import com.mytelco.adminbff.content.model.ContentRollbackRequest;
import com.mytelco.adminbff.content.model.ContentState;
import com.mytelco.adminbff.content.model.ContentSummaryResponse;
import com.mytelco.adminbff.content.model.ContentUpdateRequest;
import com.mytelco.adminbff.content.model.ContentVersionResponse;
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
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ContentManagementService {

    private final ObjectMapper objectMapper;
    private final Path operatorsBasePath;
    private final Map<String, Map<String, ContentItemState>> contentIndex = new ConcurrentHashMap<>();

    public ContentManagementService(
        ObjectMapper objectMapper,
        @Value("${admin.config.operators-path:platform-config/operators}") String operatorsPath
    ) {
        this.objectMapper = objectMapper;
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
                    .forEach(this::loadOperatorContent);
            }
        } catch (IOException ioException) {
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Failed loading content metadata",
                ioException
            );
        }
    }

    public List<ContentSummaryResponse> listContent(String operatorId) {
        ensureOperatorExists(operatorId);

        Map<String, ContentItemState> operatorContent = contentIndex.get(operatorId);
        if (operatorContent == null || operatorContent.isEmpty()) {
            return List.of();
        }

        return operatorContent.values().stream()
            .map(this::toSummary)
            .sorted(Comparator.comparing(ContentSummaryResponse::contentId))
            .toList();
    }

    public ContentLocaleResponse getContent(String operatorId, String contentId, String locale, Integer version) {
        String sanitizedLocale = sanitizeLocale(locale);

        ContentItemState item = resolveContentItem(operatorId, contentId, false);
        List<ContentVersion> history = versionsForLocale(item, sanitizedLocale);

        if (history.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No versions found for locale: " + sanitizedLocale);
        }

        ContentVersion target = selectVersion(history, version);
        List<ContentVersionResponse> responseHistory = history.stream()
            .sorted(Comparator.comparingInt(ContentVersion::version).reversed())
            .map(this::toResponse)
            .toList();

        return new ContentLocaleResponse(item.contentId(), sanitizedLocale, toResponse(target), responseHistory);
    }

    public ContentVersionResponse updateContent(
        String operatorId,
        String contentId,
        ContentUpdateRequest request,
        String actor
    ) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Update payload is required");
        }

        ContentItemState item = resolveContentItem(operatorId, contentId, true);
        String locale = sanitizeLocale(request.locale());
        String title = sanitizeText(request.title(), "title");
        String body = sanitizeText(request.body(), "body");
        String notes = StringUtils.hasText(request.notes()) ? request.notes().trim() : null;
        ContentState desiredState = request.state() == null ? ContentState.DRAFT : request.state();
        String normalizedActor = normalizeActor(actor);
        String reviewer = StringUtils.hasText(request.reviewer()) ? request.reviewer().trim() : null;

        synchronized (item) {
            List<ContentVersion> history = item.versionsByLocale().computeIfAbsent(locale, key -> new ArrayList<>());
            int nextVersion = history.stream().mapToInt(ContentVersion::version).max().orElse(0) + 1;
            Instant now = Instant.now();
            ContentVersion newVersion = new ContentVersion(
                item.contentId(),
                locale,
                nextVersion,
                desiredState,
                title,
                body,
                notes,
                normalizedActor,
                reviewer,
                now
            );
            history.add(newVersion);
            item.updatedAt = now;
            return toResponse(newVersion);
        }
    }

    public ContentVersionResponse rollbackContent(
        String operatorId,
        String contentId,
        ContentRollbackRequest request,
        String actor
    ) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rollback payload is required");
        }

        ContentItemState item = resolveContentItem(operatorId, contentId, false);
        String locale = sanitizeLocale(request.locale());
        String normalizedActor = normalizeActor(actor);

        synchronized (item) {
            List<ContentVersion> history = versionsForLocale(item, locale);
            if (history.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No versions found for locale: " + locale);
            }

            ContentVersion target = request.version() == null
                ? findPreviousPublished(history)
                : history.stream()
                    .filter(version -> version.version() == request.version())
                    .findFirst()
                    .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Version not found: " + request.version()
                    ));

            int nextVersion = history.stream().mapToInt(ContentVersion::version).max().orElse(0) + 1;
            Instant now = Instant.now();
            ContentVersion rolled = new ContentVersion(
                item.contentId(),
                locale,
                nextVersion,
                target.state(),
                target.title(),
                target.body(),
                "Rollback to version " + target.version(),
                normalizedActor,
                target.reviewer(),
                now
            );
            history.add(rolled);
            item.updatedAt = now;
            return toResponse(rolled);
        }
    }

    private ContentLocaleSummary toLocaleSummary(List<ContentVersion> history) {
        ContentVersion latest = history.stream()
            .max(Comparator.comparingInt(ContentVersion::version))
            .orElseThrow();
        return new ContentLocaleSummary(
            latest.locale(),
            latest.version(),
            latest.state(),
            latest.updatedAt(),
            latest.author(),
            latest.reviewer()
        );
    }

    private ContentSummaryResponse toSummary(ContentItemState item) {
        List<ContentLocaleSummary> locales = item.versionsByLocale().values().stream()
            .map(this::toLocaleSummary)
            .toList();
        return new ContentSummaryResponse(item.contentId(), locales);
    }

    private List<ContentVersion> versionsForLocale(ContentItemState item, String locale) {
        return item.versionsByLocale().getOrDefault(locale, List.of());
    }

    private ContentVersion selectVersion(List<ContentVersion> history, Integer version) {
        if (version == null) {
            return history.stream()
                .max(Comparator.comparingInt(ContentVersion::version))
                .orElseThrow();
        }
        return history.stream()
            .filter(entry -> entry.version() == version)
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Version not found: " + version
            ));
    }

    private ContentVersionResponse toResponse(ContentVersion entry) {
        return new ContentVersionResponse(
            entry.contentId(),
            entry.locale(),
            entry.version(),
            entry.state(),
            entry.title(),
            entry.body(),
            entry.notes(),
            entry.author(),
            entry.reviewer(),
            entry.updatedAt()
        );
    }

    private ContentItemState resolveContentItem(String operatorId, String contentId, boolean createIfMissing) {
        ensureOperatorExists(operatorId);
        String sanitizedContentId = sanitizeContentId(contentId);

        Map<String, ContentItemState> operatorContent = contentIndex.computeIfAbsent(
            operatorId,
            key -> new ConcurrentHashMap<>()
        );

        ContentItemState existing = operatorContent.get(sanitizedContentId);
        if (existing != null) {
            return existing;
        }
        if (!createIfMissing) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Content not found: " + sanitizedContentId
            );
        }

        ContentItemState created = new ContentItemState(sanitizedContentId);
        operatorContent.put(sanitizedContentId, created);
        return created;
    }

    private ContentVersion findPreviousPublished(List<ContentVersion> history) {
        List<ContentVersion> reversed = history.stream()
            .sorted(Comparator.comparingInt(ContentVersion::version).reversed())
            .toList();
        if (reversed.size() < 2) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "No previous version available for rollback"
            );
        }

        return reversed.stream()
            .skip(1)
            .filter(entry -> entry.state() == ContentState.PUBLISHED)
            .findFirst()
            .orElse(reversed.get(1));
    }

    private void loadOperatorContent(Path operatorPath) {
        String operatorId = operatorPath.getFileName().toString();
        Path contentDir = operatorPath.resolve("content");
        if (!Files.exists(contentDir) || !Files.isDirectory(contentDir)) {
            return;
        }

        try (var stream = Files.list(contentDir)) {
            stream.filter(path -> path.toString().endsWith(".json"))
                .forEach(path -> loadContentFile(operatorId, path));
        } catch (IOException ioException) {
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Failed loading content for operator: " + operatorId,
                ioException
            );
        }
    }

    private void loadContentFile(String operatorId, Path filePath) {
        try {
            ContentFileDto file = objectMapper.readValue(filePath.toFile(), ContentFileDto.class);
            if (!StringUtils.hasText(file.contentId())) {
                return;
            }
            Map<String, ContentItemState> operatorContent = contentIndex.computeIfAbsent(operatorId, key -> new ConcurrentHashMap<>());
            ContentItemState state = new ContentItemState(file.contentId(), parseInstant(file.updatedAt(), Instant.now()));
            for (ContentVersionDto dto : file.versions()) {
                if (!StringUtils.hasText(dto.locale()) || dto.version() < 1) {
                    continue;
                }
                ContentVersion version = new ContentVersion(
                    file.contentId(),
                    dto.locale().trim(),
                    dto.version(),
                    dto.state() == null ? ContentState.DRAFT : dto.state(),
                    StringUtils.hasText(dto.title()) ? dto.title().trim() : "",
                    StringUtils.hasText(dto.body()) ? dto.body().trim() : "",
                    StringUtils.hasText(dto.notes()) ? dto.notes().trim() : null,
                    StringUtils.hasText(dto.author()) ? dto.author().trim() : "system",
                    dto.reviewer(),
                    parseInstant(dto.updatedAt(), Instant.now())
                );
                state.versionsByLocale().computeIfAbsent(version.locale(), key -> new ArrayList<>()).add(version);
            }
            operatorContent.put(state.contentId, state);
        } catch (IOException ioException) {
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Failed reading content file: " + filePath,
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

    private String sanitizeContentId(String contentId) {
        if (!StringUtils.hasText(contentId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "contentId is required");
        }
        String trimmed = contentId.trim();
        if (!trimmed.matches("[a-z0-9-]+")) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "contentId must be kebab-case ([a-z0-9-]+)"
            );
        }
        return trimmed;
    }

    private String sanitizeLocale(String locale) {
        if (!StringUtils.hasText(locale)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Locale is required");
        }
        return locale.trim();
    }

    private String sanitizeText(String value, String fieldName) {
        if (!StringUtils.hasText(value)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " cannot be empty");
        }
        return value.trim();
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

    private static class ContentItemState {
        private final String contentId;
        private final Map<String, List<ContentVersion>> versionsByLocale = new LinkedHashMap<>();
        private Instant updatedAt;

        ContentItemState(String contentId) {
            this(contentId, Instant.now());
        }

        ContentItemState(String contentId, Instant updatedAt) {
            this.contentId = contentId;
            this.updatedAt = updatedAt;
        }

        public String contentId() {
            return contentId;
        }

        public Instant updatedAt() {
            return updatedAt;
        }

        public Map<String, List<ContentVersion>> versionsByLocale() {
            return versionsByLocale;
        }
    }

    private record ContentVersion(
        String contentId,
        String locale,
        int version,
        ContentState state,
        String title,
        String body,
        String notes,
        String author,
        String reviewer,
        Instant updatedAt
    ) {
    }

    private record ContentFileDto(
        String contentId,
        String operatorId,
        String updatedAt,
        List<ContentVersionDto> versions
    ) {
    }

    private record ContentVersionDto(
        String locale,
        int version,
        ContentState state,
        String title,
        String body,
        String notes,
        String author,
        String reviewer,
        String updatedAt
    ) {
    }
}
