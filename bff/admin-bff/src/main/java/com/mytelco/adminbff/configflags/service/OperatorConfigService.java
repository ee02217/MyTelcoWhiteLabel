package com.mytelco.adminbff.configflags.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mytelco.adminbff.configflags.model.AuditEntry;
import com.mytelco.adminbff.configflags.model.FlagUpdateResponse;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OperatorConfigService {

    private final ObjectMapper objectMapper;
    private final Path operatorsBasePath;

    private final Map<String, FlagConfig> flagConfigs = new ConcurrentHashMap<>();
    private final Map<String, Map<String, Object>> journeyConfigs = new ConcurrentHashMap<>();
    private final Map<String, List<AuditEntry>> auditLog = new ConcurrentHashMap<>();

    public OperatorConfigService(ObjectMapper objectMapper,
                                 @Value("${admin.config.operators-path:platform-config/operators}") String operatorsPath) {
        this.objectMapper = objectMapper;
        this.operatorsBasePath = resolveOperatorsPath(operatorsPath);
    }

    @PostConstruct
    public void loadConfigs() {
        try {
            if (!Files.exists(operatorsBasePath)) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Operators config path not found: " + operatorsBasePath);
            }

            try (var stream = Files.list(operatorsBasePath)) {
                stream.filter(Files::isDirectory)
                    .filter(path -> !"schema".equals(path.getFileName().toString()))
                    .forEach(this::loadOperatorConfigs);
            }
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Failed loading operator configs", e);
        }
    }

    public Map<String, Boolean> getFlags(String operatorId, String channel) {
        var config = resolveOperator(operatorId);
        var channelConfig = config.channels().get(channel);
        if (channelConfig == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Channel not found: " + channel);
        }
        return channelConfig;
    }

    public Map<String, Object> getJourney(String operatorId, String journeyId) {
        var key = journeyKey(operatorId, journeyId);
        var config = journeyConfigs.get(key);
        if (config == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Journey not found for operator=" + operatorId + " journey=" + journeyId);
        }
        return config;
    }

    public FlagUpdateResponse updateFlag(String operatorId, String channel, String flagKey, boolean enabled, String actor) {
        var config = resolveOperator(operatorId);
        var channelFlags = config.channels().get(channel);
        if (channelFlags == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Channel not found: " + channel);
        }

        var oldValue = channelFlags.getOrDefault(flagKey, false);
        channelFlags.put(flagKey, enabled);

        var newVersion = config.version() + 1;
        var updatedAt = Instant.now();
        flagConfigs.put(operatorId, new FlagConfig(config.operatorId(), newVersion, updatedAt, config.channels()));

        var entry = new AuditEntry(operatorId, channel, flagKey, oldValue, enabled, actor, updatedAt, newVersion);
        auditLog.computeIfAbsent(auditKey(operatorId, channel), ignored -> new ArrayList<>()).add(entry);

        return new FlagUpdateResponse(operatorId, channel, flagKey, enabled, newVersion, actor, updatedAt);
    }

    public List<AuditEntry> getAudit(String operatorId, String channel) {
        return auditLog.getOrDefault(auditKey(operatorId, channel), List.of())
            .stream()
            .sorted(Comparator.comparing(AuditEntry::timestamp).reversed())
            .toList();
    }

    private void loadOperatorConfigs(Path operatorPath) {
        var operatorId = operatorPath.getFileName().toString();

        try {
            var flagsPath = operatorPath.resolve("features/flags.json");
            var flagsRaw = objectMapper.readValue(flagsPath.toFile(), new TypeReference<Map<String, Object>>() {});
            var version = ((Number) flagsRaw.getOrDefault("version", 1)).longValue();
            var updatedAt = Instant.parse((String) flagsRaw.get("updatedAt"));

            var channelsNode = (Map<String, Object>) flagsRaw.get("channels");
            Map<String, Map<String, Boolean>> channels = new ConcurrentHashMap<>();
            for (var entry : channelsNode.entrySet()) {
                var channelConfig = (Map<String, Object>) entry.getValue();
                var flags = (Map<String, Boolean>) channelConfig.get("flags");
                channels.put(entry.getKey(), new ConcurrentHashMap<>(flags));
            }

            flagConfigs.put(operatorId, new FlagConfig(operatorId, version, updatedAt, channels));

            var journeysPath = operatorPath.resolve("journeys");
            if (Files.exists(journeysPath)) {
                try (var journeyFiles = Files.list(journeysPath)) {
                    journeyFiles.filter(path -> path.toString().endsWith(".json"))
                        .forEach(journeyFile -> {
                            try {
                                var journeyRaw = objectMapper.readValue(journeyFile.toFile(), new TypeReference<Map<String, Object>>() {});
                                journeyConfigs.put(journeyKey(operatorId, (String) journeyRaw.get("journeyId")), journeyRaw);
                            } catch (IOException e) {
                                throw new IllegalStateException("Failed loading journey: " + journeyFile, e);
                            }
                        });
                }
            }
        } catch (IOException e) {
            throw new IllegalStateException("Failed loading operator config for " + operatorId, e);
        }
    }

    private FlagConfig resolveOperator(String operatorId) {
        var operator = flagConfigs.get(operatorId);
        if (operator != null) {
            return operator;
        }
        var fallback = flagConfigs.get("default");
        if (fallback == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Operator config not found: " + operatorId);
        }
        return fallback;
    }

    private String journeyKey(String operatorId, String journeyId) {
        return operatorId + ":" + journeyId;
    }

    private String auditKey(String operatorId, String channel) {
        return operatorId + ":" + channel;
    }

    private Path resolveOperatorsPath(String configuredPath) {
        var direct = Path.of(configuredPath);
        if (Files.exists(direct)) {
            return direct;
        }
        var fallback = Path.of("..", "..", configuredPath);
        return Files.exists(fallback) ? fallback : direct;
    }

    record FlagConfig(String operatorId, long version, Instant updatedAt, Map<String, Map<String, Boolean>> channels) {
    }
}
