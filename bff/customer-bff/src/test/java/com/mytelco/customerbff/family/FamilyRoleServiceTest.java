package com.mytelco.customerbff.family;

import com.mytelco.customerbff.events.DomainEventPublisher;
import com.mytelco.customerbff.events.EventTopic;
import com.mytelco.customerbff.family.FamilyPermission;
import com.mytelco.customerbff.family.FamilyRole;
import com.mytelco.customerbff.family.FamilyRoleEntry;
import com.mytelco.customerbff.family.FamilyRoleUpdateRequest;
import com.mytelco.customerbff.model.AccountOverviewResponse;
import com.mytelco.customerbff.model.ActiveLine;
import com.mytelco.customerbff.model.LineStructure;
import com.mytelco.customerbff.provider.AccountProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FamilyRoleServiceTest {

    @Mock
    private AccountProvider accountProvider;

    @Mock
    private DomainEventPublisher eventPublisher;

    private FamilyRoleService service;

    @BeforeEach
    void setUp() {
        service = new FamilyRoleService(accountProvider, eventPublisher);
    }

    @Test
    void getRoles_assignsOwnerOnPrimaryLine() {
        when(accountProvider.getAccountOverview("cust-1")).thenReturn(overview());

        FamilyRolesResponse response = service.getRoles("cust-1", null);

        assertThat(response.assignments()).hasSize(2);
        FamilyRoleEntry ownerLine = response.assignments().stream()
            .filter(entry -> entry.lineId().equals("line-1"))
            .findFirst()
            .orElseThrow();
        assertThat(ownerLine.role()).isEqualTo(FamilyRole.OWNER);
        assertThat(response.permissionMatrix().keySet()).contains(FamilyRole.OWNER, FamilyRole.MANAGER, FamilyRole.MEMBER);
    }

    @Test
    void updateRole_invokesPublisherAndAudit() {
        when(accountProvider.getAccountOverview("cust-1")).thenReturn(overview());
        FamilyRoleUpdateRequest req = new FamilyRoleUpdateRequest(FamilyRole.MANAGER, "Let manager help");
        FamilyRoleEntry updated = service.updateRole("cust-1", "line-1", "line-2", req, "corr-1");

        assertThat(updated.role()).isEqualTo(FamilyRole.MANAGER);
        assertThat(service.audit("cust-1", 10)).hasSizeGreaterThanOrEqualTo(1);

        ArgumentCaptor<Map<String, Object>> payloadCaptor = ArgumentCaptor.forClass(Map.class);
        verify(eventPublisher).publish(
            eq(EventTopic.FAMILY),
            eq("family.role.changed.v1"),
            eq("cust-1"),
            eq("corr-1"),
            payloadCaptor.capture()
        );
        assertThat(payloadCaptor.getValue()).containsEntry("lineId", "line-2");
    }

    @Test
    void requirePermission_deniesMemberManagePlan() {
        when(accountProvider.getAccountOverview("cust-1")).thenReturn(overview());

        assertThatThrownBy(() -> service.requirePermission("cust-1", "line-2", "line-1", FamilyPermission.MANAGE_PLAN))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(error -> ((ResponseStatusException) error).getStatusCode())
            .isEqualTo(HttpStatus.FORBIDDEN);
    }

    private AccountOverviewResponse overview() {
        List<ActiveLine> lines = List.of(
            new ActiveLine("line-1", "3515000001", "primary", "ACTIVE"),
            new ActiveLine("line-2", "3515000002", "secondary", "ACTIVE")
        );
        return new AccountOverviewResponse(
            "Premium",
            lines,
            lines.size(),
            LocalDate.now().plusDays(30),
            new BigDecimal("0"),
            "postpaid",
            LineStructure.MULTI_LINE_READY
        );
    }
}
