package com.mytelco.customerbff.family.controls;

import com.mytelco.customerbff.events.DomainEventPublisher;
import com.mytelco.customerbff.events.EventTopic;
import com.mytelco.customerbff.family.FamilyPermission;
import com.mytelco.customerbff.family.FamilyRole;
import com.mytelco.customerbff.family.FamilyRoleEntry;
import com.mytelco.customerbff.family.FamilyRoleService;
import com.mytelco.customerbff.family.FamilyRolesResponse;
import com.mytelco.customerbff.model.LineUsageEntry;
import com.mytelco.customerbff.model.ServiceUsageBreakdown;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class SharedControlService {

    private static final int DEFAULT_RECENT_LIMIT = 100;
    private static final int MAX_RECENT_LIMIT = 500;

    private static final double THRESHOLD_WARNING_80 = 0.80;
    private static final double THRESHOLD_WARNING_90 = 0.90;
    private static final double THRESHOLD_BREACH = 1.00;

    private static final Map<SharedControlCategory, Double> DEFAULT_CAP_LIMITS = Map.of(
        SharedControlCategory.DATA_MB, 20000d,
        SharedControlCategory.VOICE_MIN, 1000d,
        SharedControlCategory.SMS_COUNT, 1000d,
        SharedControlCategory.SPEND_EUR, 250d,
        SharedControlCategory.ADDON_PURCHASES, 10d
    );

    private final FamilyRoleService familyRoleService;
    private final DomainEventPublisher eventPublisher;

    private final Map<String, Map<String, EnumMap<SharedControlCategory, Double>>> capsByCustomer =
        new ConcurrentHashMap<>();
    private final Map<String, Map<String, EnumMap<SharedControlCategory, Double>>> usageByCustomer =
        new ConcurrentHashMap<>();
    private final Map<String, Map<String, EnumMap<SharedControlCategory, Double>>> approvedAllowanceByCustomer =
        new ConcurrentHashMap<>();
    private final Map<String, List<SharedControlAlert>> alertsByCustomer = new ConcurrentHashMap<>();
    private final Map<String, List<SharedControlOverrideRequest>> overridesByCustomer = new ConcurrentHashMap<>();

    public SharedControlService(FamilyRoleService familyRoleService, DomainEventPublisher eventPublisher) {
        this.familyRoleService = familyRoleService;
        this.eventPublisher = eventPublisher;
    }

    public SharedControlsResponse getSharedControls(String customerId, String actingLineId) {
        FamilyRolesResponse roles = familyRoleService.getRoles(customerId, actingLineId);
        List<String> lineIds = roles.assignments().stream().map(FamilyRoleEntry::lineId).toList();

        synchronized (this) {
            ensureDefaults(customerId, lineIds);

            List<SharedControlCap> caps = new ArrayList<>();
            List<SharedControlUsage> usage = new ArrayList<>();

            for (String lineId : lineIds) {
                for (SharedControlCategory category : SharedControlCategory.values()) {
                    double limit = capLimit(customerId, lineId, category);
                    double consumed = usageValue(customerId, lineId, category);
                    caps.add(new SharedControlCap(lineId, category, limit, category.unit(), Instant.now()));
                    usage.add(new SharedControlUsage(
                        lineId,
                        category,
                        consumed,
                        limit,
                        category.unit(),
                        usageRatio(consumed, limit)
                    ));
                }
            }

            caps.sort(Comparator.comparing(SharedControlCap::lineId).thenComparing(cap -> cap.category().name()));
            usage.sort(Comparator.comparing(SharedControlUsage::lineId).thenComparing(item -> item.category().name()));

            List<SharedControlAlert> recentAlerts = alertsByCustomer.getOrDefault(customerId, List.of())
                .stream()
                .sorted(Comparator.comparing(SharedControlAlert::createdAt).reversed())
                .limit(DEFAULT_RECENT_LIMIT)
                .toList();

            List<SharedControlOverrideRequest> recentRequests = overridesByCustomer.getOrDefault(customerId, List.of())
                .stream()
                .sorted(Comparator.comparing(SharedControlOverrideRequest::createdAt).reversed())
                .limit(DEFAULT_RECENT_LIMIT)
                .toList();

            Map<String, String> roleByLine = roles.assignments().stream()
                .collect(Collectors.toMap(FamilyRoleEntry::lineId, entry -> entry.role().name(), (a, b) -> a, LinkedHashMap::new));

            return new SharedControlsResponse(
                roles.actingLineId(),
                roles.actingRole(),
                caps,
                usage,
                recentAlerts,
                recentRequests,
                roleByLine,
                Instant.now()
            );
        }
    }

    public synchronized SharedControlCap updateCap(
        String customerId,
        String actingLineId,
        String lineId,
        SharedControlCapUpdateRequest request,
        String correlationId
    ) {
        if (request == null || request.category() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "category is required");
        }
        if (request.limit() <= 0d) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "limit must be > 0");
        }

        String normalizedLineId = normalizeLineId(lineId);
        familyRoleService.requirePermission(customerId, actingLineId, normalizedLineId, FamilyPermission.MANAGE_ROLES);
        ensureDefaults(customerId, lineIds(customerId, actingLineId));

        capsByCustomer
            .computeIfAbsent(customerId, key -> new ConcurrentHashMap<>())
            .computeIfAbsent(normalizedLineId, key -> new EnumMap<>(SharedControlCategory.class))
            .put(request.category(), request.limit());

        SharedControlCap cap = new SharedControlCap(
            normalizedLineId,
            request.category(),
            request.limit(),
            request.category().unit(),
            Instant.now()
        );

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("lineId", normalizedLineId);
        payload.put("category", request.category().name());
        payload.put("limit", request.limit());
        payload.put("unit", request.category().unit());
        payload.put("note", StringUtils.hasText(request.note()) ? request.note().trim() : "");

        eventPublisher.publish(
            EventTopic.FAMILY,
            "family.shared-control.cap.updated.v1",
            customerId,
            normalizeCorrelation(correlationId),
            payload
        );

        return cap;
    }

    public synchronized SharedControlOverrideRequest createOverrideRequest(
        String customerId,
        String actingLineId,
        SharedControlOverrideCreateRequest request,
        String correlationId
    ) {
        if (request == null || request.category() == null || !StringUtils.hasText(request.lineId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "lineId and category are required");
        }
        if (request.requestedAmount() <= 0d) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "requestedAmount must be > 0");
        }

        String normalizedLineId = normalizeLineId(request.lineId());
        familyRoleService.requirePermission(customerId, actingLineId, normalizedLineId, FamilyPermission.VIEW_USAGE);
        ensureDefaults(customerId, lineIds(customerId, actingLineId));

        SharedControlOverrideRequest overrideRequest = new SharedControlOverrideRequest(
            UUID.randomUUID().toString(),
            normalizedLineId,
            request.category(),
            request.requestedAmount(),
            StringUtils.hasText(request.reason()) ? request.reason().trim() : "No reason provided",
            SharedControlOverrideStatus.PENDING,
            customerId,
            resolveActorLine(customerId, actingLineId),
            Instant.now(),
            null,
            null,
            null,
            null
        );

        overridesByCustomer
            .computeIfAbsent(customerId, key -> new ArrayList<>())
            .add(overrideRequest);

        eventPublisher.publish(
            EventTopic.FAMILY,
            "family.shared-control.override.requested.v1",
            customerId,
            normalizeCorrelation(correlationId),
            Map.of(
                "requestId", overrideRequest.requestId(),
                "lineId", overrideRequest.lineId(),
                "category", overrideRequest.category().name(),
                "requestedAmount", overrideRequest.requestedAmount(),
                "reason", overrideRequest.reason()
            )
        );

        return overrideRequest;
    }

    public synchronized SharedControlOverrideRequest decideOverride(
        String customerId,
        String actingLineId,
        String requestId,
        SharedControlOverrideDecisionRequest request,
        String correlationId
    ) {
        familyRoleService.requirePermission(customerId, actingLineId, null, FamilyPermission.MANAGE_ROLES);

        List<SharedControlOverrideRequest> overrides = overridesByCustomer.computeIfAbsent(customerId, key -> new ArrayList<>());
        SharedControlOverrideRequest existing = overrides.stream()
            .filter(item -> item.requestId().equals(requestId))
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Override request not found"));

        if (existing.status() != SharedControlOverrideStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Override request already resolved");
        }

        SharedControlOverrideStatus nextStatus = request != null && request.approve()
            ? SharedControlOverrideStatus.APPROVED
            : SharedControlOverrideStatus.REJECTED;

        SharedControlOverrideRequest updated = new SharedControlOverrideRequest(
            existing.requestId(),
            existing.lineId(),
            existing.category(),
            existing.requestedAmount(),
            existing.reason(),
            nextStatus,
            existing.requestedByCustomerId(),
            existing.requestedByLineId(),
            existing.createdAt(),
            customerId,
            resolveActorLine(customerId, actingLineId),
            Instant.now(),
            request != null && StringUtils.hasText(request.note()) ? request.note().trim() : null
        );

        overrides.removeIf(item -> item.requestId().equals(requestId));
        overrides.add(updated);

        if (nextStatus == SharedControlOverrideStatus.APPROVED) {
            approvedAllowanceByCustomer
                .computeIfAbsent(customerId, key -> new ConcurrentHashMap<>())
                .computeIfAbsent(updated.lineId(), key -> new EnumMap<>(SharedControlCategory.class))
                .merge(updated.category(), updated.requestedAmount(), Double::sum);
        }

        eventPublisher.publish(
            EventTopic.FAMILY,
            nextStatus == SharedControlOverrideStatus.APPROVED
                ? "family.shared-control.override.approved.v1"
                : "family.shared-control.override.rejected.v1",
            customerId,
            normalizeCorrelation(correlationId),
            Map.of(
                "requestId", updated.requestId(),
                "lineId", updated.lineId(),
                "category", updated.category().name(),
                "status", updated.status().name(),
                "requestedAmount", updated.requestedAmount(),
                "decisionNote", updated.decisionNote() == null ? "" : updated.decisionNote()
            )
        );

        return updated;
    }

    public synchronized void assertWithinCap(
        String customerId,
        String actingLineId,
        String lineId,
        SharedControlCategory category,
        double amount,
        String reason,
        String correlationId
    ) {
        if (amount <= 0d) {
            return;
        }

        String normalizedLineId = normalizeLineId(lineId);
        FamilyPermission permission = category == SharedControlCategory.ADDON_PURCHASES
            ? FamilyPermission.MANAGE_PLAN
            : FamilyPermission.VIEW_USAGE;

        familyRoleService.requirePermission(customerId, actingLineId, normalizedLineId, permission);

        FamilyRolesResponse roles = familyRoleService.getRoles(customerId, actingLineId);
        ensureDefaults(customerId, roles.assignments().stream().map(FamilyRoleEntry::lineId).toList());

        if (roles.actingRole() == FamilyRole.OWNER) {
            return;
        }

        double limit = capLimit(customerId, normalizedLineId, category);
        double consumed = usageValue(customerId, normalizedLineId, category);
        double allowance = allowanceValue(customerId, normalizedLineId, category);

        if (consumed + amount <= limit + allowance) {
            return;
        }

        SharedControlOverrideRequest overrideRequest = createOverrideRequest(
            customerId,
            actingLineId,
            new SharedControlOverrideCreateRequest(
                normalizedLineId,
                category,
                amount,
                StringUtils.hasText(reason) ? reason : "Automatic request on cap breach"
            ),
            correlationId
        );

        throw new ResponseStatusException(
            HttpStatus.CONFLICT,
            "Shared control cap exceeded. Override request created: " + overrideRequest.requestId()
        );
    }

    public synchronized void recordUsage(
        String customerId,
        String lineId,
        SharedControlCategory category,
        double amount,
        String correlationId,
        String source
    ) {
        if (amount <= 0d) {
            return;
        }

        String normalizedLineId = normalizeLineId(lineId);
        ensureDefaults(customerId, lineIds(customerId, null));

        double before = usageValue(customerId, normalizedLineId, category);
        double after = before + amount;
        setUsage(customerId, normalizedLineId, category, after);

        evaluateThresholds(customerId, normalizedLineId, category, before, after, capLimit(customerId, normalizedLineId, category));

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("lineId", normalizedLineId);
        payload.put("category", category.name());
        payload.put("source", StringUtils.hasText(source) ? source.trim() : "unknown");
        payload.put("delta", amount);
        payload.put("consumed", after);
        payload.put("limit", capLimit(customerId, normalizedLineId, category));

        eventPublisher.publish(
            EventTopic.FAMILY,
            "family.shared-control.usage.updated.v1",
            customerId,
            normalizeCorrelation(correlationId),
            payload
        );
    }

    public synchronized void syncUsageFromBreakdown(
        String customerId,
        List<LineUsageEntry> lineUsageEntries,
        String correlationId
    ) {
        if (lineUsageEntries == null || lineUsageEntries.isEmpty()) {
            return;
        }

        ensureDefaults(customerId, lineUsageEntries.stream().map(LineUsageEntry::lineId).toList());

        for (LineUsageEntry entry : lineUsageEntries) {
            ServiceUsageBreakdown breakdown = entry.usage();
            if (breakdown == null) {
                continue;
            }

            syncSingleUsage(customerId, entry.lineId(), SharedControlCategory.DATA_MB, (double) breakdown.dataMb());
            syncSingleUsage(customerId, entry.lineId(), SharedControlCategory.VOICE_MIN, (double) breakdown.voiceMinutes());
            syncSingleUsage(customerId, entry.lineId(), SharedControlCategory.SMS_COUNT, (double) breakdown.smsCount());
        }

        eventPublisher.publish(
            EventTopic.FAMILY,
            "family.shared-control.usage.synced.v1",
            customerId,
            normalizeCorrelation(correlationId),
            Map.of("lineCount", lineUsageEntries.size())
        );
    }

    private void syncSingleUsage(String customerId, String lineId, SharedControlCategory category, double nextValue) {
        if (nextValue < 0d) {
            return;
        }
        String normalizedLineId = normalizeLineId(lineId);
        double before = usageValue(customerId, normalizedLineId, category);
        setUsage(customerId, normalizedLineId, category, nextValue);
        evaluateThresholds(customerId, normalizedLineId, category, before, nextValue, capLimit(customerId, normalizedLineId, category));
    }

    private void evaluateThresholds(
        String customerId,
        String lineId,
        SharedControlCategory category,
        double before,
        double after,
        double limit
    ) {
        if (limit <= 0d) {
            return;
        }

        double beforeRatio = usageRatio(before, limit);
        double afterRatio = usageRatio(after, limit);

        if (beforeRatio < THRESHOLD_WARNING_80 && afterRatio >= THRESHOLD_WARNING_80) {
            addAlert(customerId, lineId, category, SharedControlAlertLevel.WARNING_80, after, limit);
        }
        if (beforeRatio < THRESHOLD_WARNING_90 && afterRatio >= THRESHOLD_WARNING_90) {
            addAlert(customerId, lineId, category, SharedControlAlertLevel.WARNING_90, after, limit);
        }
        if (beforeRatio < THRESHOLD_BREACH && afterRatio >= THRESHOLD_BREACH) {
            addAlert(customerId, lineId, category, SharedControlAlertLevel.BREACH, after, limit);
        }
    }

    private void addAlert(
        String customerId,
        String lineId,
        SharedControlCategory category,
        SharedControlAlertLevel level,
        double consumed,
        double limit
    ) {
        List<SharedControlAlert> alerts = alertsByCustomer.computeIfAbsent(customerId, key -> new ArrayList<>());
        alerts.add(new SharedControlAlert(
            UUID.randomUUID().toString(),
            lineId,
            category,
            level,
            consumed,
            limit,
            category.unit(),
            Instant.now()
        ));

        if (alerts.size() > MAX_RECENT_LIMIT) {
            alerts.sort(Comparator.comparing(SharedControlAlert::createdAt).reversed());
            alertsByCustomer.put(customerId, new ArrayList<>(alerts.subList(0, MAX_RECENT_LIMIT)));
        }
    }

    private void ensureDefaults(String customerId, List<String> lineIds) {
        Map<String, EnumMap<SharedControlCategory, Double>> capLines = capsByCustomer
            .computeIfAbsent(customerId, key -> new ConcurrentHashMap<>());
        Map<String, EnumMap<SharedControlCategory, Double>> usageLines = usageByCustomer
            .computeIfAbsent(customerId, key -> new ConcurrentHashMap<>());
        Map<String, EnumMap<SharedControlCategory, Double>> allowanceLines = approvedAllowanceByCustomer
            .computeIfAbsent(customerId, key -> new ConcurrentHashMap<>());

        for (String lineId : lineIds) {
            EnumMap<SharedControlCategory, Double> capMap = capLines.computeIfAbsent(
                lineId,
                key -> new EnumMap<>(SharedControlCategory.class)
            );
            EnumMap<SharedControlCategory, Double> usageMap = usageLines.computeIfAbsent(
                lineId,
                key -> new EnumMap<>(SharedControlCategory.class)
            );
            EnumMap<SharedControlCategory, Double> allowanceMap = allowanceLines.computeIfAbsent(
                lineId,
                key -> new EnumMap<>(SharedControlCategory.class)
            );

            for (SharedControlCategory category : SharedControlCategory.values()) {
                capMap.putIfAbsent(category, DEFAULT_CAP_LIMITS.get(category));
                usageMap.putIfAbsent(category, 0d);
                allowanceMap.putIfAbsent(category, 0d);
            }
        }

        capLines.keySet().removeIf(lineId -> !lineIds.contains(lineId));
        usageLines.keySet().removeIf(lineId -> !lineIds.contains(lineId));
        allowanceLines.keySet().removeIf(lineId -> !lineIds.contains(lineId));
    }

    private List<String> lineIds(String customerId, String actingLineId) {
        return familyRoleService.getRoles(customerId, actingLineId)
            .assignments().stream().map(FamilyRoleEntry::lineId).toList();
    }

    private String resolveActorLine(String customerId, String actingLineId) {
        return familyRoleService.getRoles(customerId, actingLineId).actingLineId();
    }

    private double capLimit(String customerId, String lineId, SharedControlCategory category) {
        return capsByCustomer.getOrDefault(customerId, Map.of())
            .getOrDefault(lineId, new EnumMap<>(SharedControlCategory.class))
            .getOrDefault(category, DEFAULT_CAP_LIMITS.get(category));
    }

    private double usageValue(String customerId, String lineId, SharedControlCategory category) {
        return usageByCustomer.getOrDefault(customerId, Map.of())
            .getOrDefault(lineId, new EnumMap<>(SharedControlCategory.class))
            .getOrDefault(category, 0d);
    }

    private double allowanceValue(String customerId, String lineId, SharedControlCategory category) {
        return approvedAllowanceByCustomer.getOrDefault(customerId, Map.of())
            .getOrDefault(lineId, new EnumMap<>(SharedControlCategory.class))
            .getOrDefault(category, 0d);
    }

    private void setUsage(String customerId, String lineId, SharedControlCategory category, double value) {
        usageByCustomer
            .computeIfAbsent(customerId, key -> new ConcurrentHashMap<>())
            .computeIfAbsent(lineId, key -> new EnumMap<>(SharedControlCategory.class))
            .put(category, value);
    }

    private String normalizeLineId(String lineId) {
        if (!StringUtils.hasText(lineId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "lineId is required");
        }
        return lineId.trim();
    }

    private String normalizeCorrelation(String correlationId) {
        if (!StringUtils.hasText(correlationId)) {
            return null;
        }
        return correlationId.trim();
    }

    private double usageRatio(double consumed, double limit) {
        if (limit <= 0d) {
            return 0d;
        }
        return consumed / limit;
    }
}
