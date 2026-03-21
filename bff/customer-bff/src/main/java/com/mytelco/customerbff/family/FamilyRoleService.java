package com.mytelco.customerbff.family;

import com.mytelco.customerbff.events.DomainEventPublisher;
import com.mytelco.customerbff.events.EventTopic;
import com.mytelco.customerbff.model.AccountOverviewResponse;
import com.mytelco.customerbff.model.ActiveLine;
import com.mytelco.customerbff.provider.AccountProvider;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class FamilyRoleService {

    private static final int DEFAULT_AUDIT_LIMIT = 50;
    private static final int MAX_AUDIT_LIMIT = 200;

    private static final Map<FamilyRole, Set<FamilyPermission>> PERMISSION_MATRIX = Map.of(
        FamilyRole.OWNER,
        EnumSet.of(
            FamilyPermission.VIEW_USAGE,
            FamilyPermission.MANAGE_PLAN,
            FamilyPermission.MANAGE_PAYMENTS,
            FamilyPermission.MANAGE_SIM,
            FamilyPermission.MANAGE_ESIM,
            FamilyPermission.MANAGE_ROAMING,
            FamilyPermission.MANAGE_ROLES
        ),
        FamilyRole.MANAGER,
        EnumSet.of(
            FamilyPermission.VIEW_USAGE,
            FamilyPermission.MANAGE_PLAN,
            FamilyPermission.MANAGE_PAYMENTS,
            FamilyPermission.MANAGE_SIM,
            FamilyPermission.MANAGE_ESIM,
            FamilyPermission.MANAGE_ROAMING
        ),
        FamilyRole.MEMBER,
        EnumSet.of(
            FamilyPermission.VIEW_USAGE
        )
    );

    private final AccountProvider accountProvider;
    private final DomainEventPublisher eventPublisher;

    private final Map<String, Map<String, FamilyRole>> assignmentsByCustomer = new ConcurrentHashMap<>();
    private final Map<String, List<FamilyRoleAuditEntry>> auditByCustomer = new ConcurrentHashMap<>();

    public FamilyRoleService(AccountProvider accountProvider, DomainEventPublisher eventPublisher) {
        this.accountProvider = accountProvider;
        this.eventPublisher = eventPublisher;
    }

    public FamilyRolesResponse getRoles(String customerId, String actingLineId) {
        FamilyContext context = resolveContext(customerId);
        String effectiveActorLineId = resolveActingLineId(context, actingLineId);
        FamilyRole actingRole = context.assignments().getOrDefault(effectiveActorLineId, FamilyRole.MEMBER);

        List<FamilyRoleEntry> entries = context.activeLines().stream()
            .map(line -> {
                FamilyRole role = context.assignments().getOrDefault(line.lineId(), FamilyRole.MEMBER);
                return new FamilyRoleEntry(
                    line.lineId(),
                    line.msisdn(),
                    line.nickname(),
                    line.status(),
                    role,
                    List.copyOf(permissionsFor(role))
                );
            })
            .toList();

        return new FamilyRolesResponse(
            customerId,
            effectiveActorLineId,
            actingRole,
            List.copyOf(permissionsFor(actingRole)),
            entries,
            matrixAsListMap(),
            Instant.now()
        );
    }

    public FamilyRoleEntry updateRole(
        String customerId,
        String actingLineId,
        String targetLineId,
        FamilyRoleUpdateRequest request,
        String correlationId
    ) {
        if (request == null || request.role() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "role is required");
        }

        FamilyContext context = resolveContext(customerId);
        String effectiveActorLineId = resolveActingLineId(context, actingLineId);
        requirePermission(context, effectiveActorLineId, FamilyPermission.MANAGE_ROLES);

        String normalizedTargetLineId = normalizeLineId(targetLineId);
        ensureLineExists(context.activeLines(), normalizedTargetLineId);

        Map<String, FamilyRole> assignments = context.assignments();
        FamilyRole previousRole = assignments.getOrDefault(normalizedTargetLineId, FamilyRole.MEMBER);
        FamilyRole nextRole = request.role();

        if (previousRole == nextRole) {
            ActiveLine line = findLine(context.activeLines(), normalizedTargetLineId);
            return new FamilyRoleEntry(
                line.lineId(),
                line.msisdn(),
                line.nickname(),
                line.status(),
                nextRole,
                List.copyOf(permissionsFor(nextRole))
            );
        }

        ensureOwnerRoleNotRemoved(assignments, normalizedTargetLineId, previousRole, nextRole);

        assignments.put(normalizedTargetLineId, nextRole);

        FamilyRoleAuditEntry auditEntry = new FamilyRoleAuditEntry(
            UUID.randomUUID().toString(),
            normalizedTargetLineId,
            previousRole,
            nextRole,
            customerId,
            effectiveActorLineId,
            Instant.now(),
            StringUtils.hasText(request.note()) ? request.note().trim() : null
        );

        auditByCustomer
            .computeIfAbsent(customerId, key -> new ArrayList<>())
            .add(auditEntry);

        eventPublisher.publish(
            EventTopic.FAMILY,
            "family.role.changed.v1",
            customerId,
            StringUtils.hasText(correlationId) ? correlationId.trim() : null,
            Map.of(
                "lineId", normalizedTargetLineId,
                "previousRole", previousRole.name(),
                "newRole", nextRole.name(),
                "actorLineId", effectiveActorLineId,
                "changedAt", auditEntry.changedAt().toString(),
                "note", auditEntry.note() == null ? "" : auditEntry.note()
            )
        );

        ActiveLine line = findLine(context.activeLines(), normalizedTargetLineId);
        return new FamilyRoleEntry(
            line.lineId(),
            line.msisdn(),
            line.nickname(),
            line.status(),
            nextRole,
            List.copyOf(permissionsFor(nextRole))
        );
    }

    public List<FamilyRoleAuditEntry> audit(String customerId, Integer limit) {
        int normalizedLimit = normalizeAuditLimit(limit);
        return auditByCustomer
            .getOrDefault(customerId, List.of())
            .stream()
            .sorted(Comparator.comparing(FamilyRoleAuditEntry::changedAt).reversed())
            .limit(normalizedLimit)
            .toList();
    }

    public void requirePermission(
        String customerId,
        String actingLineId,
        String targetLineId,
        FamilyPermission permission
    ) {
        FamilyContext context = resolveContext(customerId);
        String effectiveActorLineId = resolveActingLineId(context, actingLineId);

        if (StringUtils.hasText(targetLineId)) {
            ensureLineExists(context.activeLines(), normalizeLineId(targetLineId));
        }

        requirePermission(context, effectiveActorLineId, permission);
    }

    private void requirePermission(FamilyContext context, String actorLineId, FamilyPermission permission) {
        FamilyRole actorRole = context.assignments().getOrDefault(actorLineId, FamilyRole.MEMBER);
        if (!permissionsFor(actorRole).contains(permission)) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Family permission denied: " + permission + " for role " + actorRole
            );
        }
    }

    private FamilyContext resolveContext(String customerId) {
        AccountOverviewResponse overview = accountProvider.getAccountOverview(customerId);
        List<ActiveLine> activeLines = overview.activeLines() == null ? List.of() : overview.activeLines();

        if (activeLines.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active lines found for family role management");
        }

        Map<String, FamilyRole> assignments = assignmentsByCustomer.computeIfAbsent(
            customerId,
            key -> new ConcurrentHashMap<>()
        );

        String primaryLineId = activeLines.get(0).lineId();
        for (int index = 0; index < activeLines.size(); index++) {
            ActiveLine line = activeLines.get(index);
            assignments.putIfAbsent(line.lineId(), index == 0 ? FamilyRole.OWNER : FamilyRole.MEMBER);
        }
        assignments.keySet().removeIf(lineId -> activeLines.stream().noneMatch(line -> line.lineId().equals(lineId)));

        if (assignments.values().stream().noneMatch(role -> role == FamilyRole.OWNER)) {
            assignments.put(primaryLineId, FamilyRole.OWNER);
        }

        return new FamilyContext(activeLines, assignments, primaryLineId);
    }

    private void ensureOwnerRoleNotRemoved(
        Map<String, FamilyRole> assignments,
        String lineId,
        FamilyRole previousRole,
        FamilyRole nextRole
    ) {
        if (previousRole != FamilyRole.OWNER || nextRole == FamilyRole.OWNER) {
            return;
        }

        long ownerCount = assignments.values().stream().filter(role -> role == FamilyRole.OWNER).count();
        if (ownerCount <= 1) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "At least one OWNER role must remain assigned"
            );
        }
    }

    private String resolveActingLineId(FamilyContext context, String actingLineId) {
        if (StringUtils.hasText(actingLineId)) {
            String normalized = normalizeLineId(actingLineId);
            ensureLineExists(context.activeLines(), normalized);
            return normalized;
        }
        return context.primaryLineId();
    }

    private String normalizeLineId(String lineId) {
        if (!StringUtils.hasText(lineId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "lineId is required");
        }
        return lineId.trim();
    }

    private void ensureLineExists(List<ActiveLine> lines, String lineId) {
        boolean exists = lines.stream().anyMatch(line -> line.lineId().equals(lineId));
        if (!exists) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Line not found: " + lineId);
        }
    }

    private ActiveLine findLine(List<ActiveLine> lines, String lineId) {
        return lines.stream()
            .filter(line -> line.lineId().equals(lineId))
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Line not found: " + lineId));
    }

    private Set<FamilyPermission> permissionsFor(FamilyRole role) {
        return PERMISSION_MATRIX.getOrDefault(role, Set.of());
    }

    private int normalizeAuditLimit(Integer limit) {
        if (limit == null || limit < 1) {
            return DEFAULT_AUDIT_LIMIT;
        }
        return Math.min(limit, MAX_AUDIT_LIMIT);
    }

    private Map<FamilyRole, List<FamilyPermission>> matrixAsListMap() {
        Map<FamilyRole, List<FamilyPermission>> matrix = new EnumMap<>(FamilyRole.class);
        PERMISSION_MATRIX.forEach((role, permissions) -> matrix.put(role, List.copyOf(permissions)));
        return matrix;
    }

    private record FamilyContext(
        List<ActiveLine> activeLines,
        Map<String, FamilyRole> assignments,
        String primaryLineId
    ) {
    }
}
