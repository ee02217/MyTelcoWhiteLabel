package com.mytelco.customerbff.family;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mytelco.customerbff.family.FamilyPermission;
import com.mytelco.customerbff.family.FamilyRole;
import com.mytelco.customerbff.family.FamilyRoleAuditEntry;
import com.mytelco.customerbff.family.FamilyRoleEntry;
import com.mytelco.customerbff.family.FamilyRoleUpdateRequest;
import com.mytelco.customerbff.family.FamilyRolesResponse;
import com.mytelco.customerbff.security.CustomerIdentityResolver;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import java.util.Map;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(SpringExtension.class)
@WebMvcTest(controllers = FamilyRolesController.class)
class FamilyRolesControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private FamilyRoleService familyRoleService;

    @MockBean
    private CustomerIdentityResolver customerIdentityResolver;

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void getRoles_returnsPayload() throws Exception {
        when(customerIdentityResolver.resolveCustomerId(any())).thenReturn("cust-1");
        when(familyRoleService.getRoles(eq("cust-1"), any())).thenReturn(sampleResponse());

        mockMvc.perform(get("/api/v1/customer/family/roles"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.assignments").isArray())
            .andExpect(jsonPath("$.actingRole").value("OWNER"));
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void updateRole_forwardsRequest() throws Exception {
        when(customerIdentityResolver.resolveCustomerId(any())).thenReturn("cust-1");
        FamilyRoleEntry updatedEntry = new FamilyRoleEntry("line-2", "3515000002", "secondary", "ACTIVE", FamilyRole.MANAGER, List.of(FamilyPermission.MANAGE_ROLES));
        when(familyRoleService.updateRole(eq("cust-1"), any(), eq("line-2"), any(), any()))
            .thenReturn(updatedEntry);

        FamilyRoleUpdateRequest request = new FamilyRoleUpdateRequest(FamilyRole.MANAGER, "note");

        mockMvc.perform(patch("/api/v1/customer/family/roles/line-2")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.role").value("MANAGER"));

        verify(familyRoleService).updateRole(eq("cust-1"), any(), eq("line-2"), any(), any());
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void audit_returnsEntries() throws Exception {
        when(customerIdentityResolver.resolveCustomerId(any())).thenReturn("cust-1");
        when(familyRoleService.audit(eq("cust-1"), eq(10))).thenReturn(List.of(sampleAudit()));

        mockMvc.perform(get("/api/v1/customer/family/roles/audit?limit=10"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].lineId").value("line-2"));
    }

    private FamilyRolesResponse sampleResponse() {
        return new FamilyRolesResponse(
            "cust-1",
            "line-1",
            FamilyRole.OWNER,
            List.of(FamilyPermission.VIEW_USAGE),
            List.of(
                new FamilyRoleEntry("line-1", "3515000001", "primary", "ACTIVE", FamilyRole.OWNER, List.of(FamilyPermission.MANAGE_ROLES)),
                new FamilyRoleEntry("line-2", "3515000002", "secondary", "ACTIVE", FamilyRole.MEMBER, List.of(FamilyPermission.VIEW_USAGE))
            ),
            Map.of(FamilyRole.OWNER, List.of(FamilyPermission.MANAGE_ROLES)),
            Instant.now()
        );
    }

    private FamilyRoleAuditEntry sampleAudit() {
        return new FamilyRoleAuditEntry("audit-1", "line-2", FamilyRole.MEMBER, FamilyRole.MANAGER, "cust-1", "line-1", Instant.now(), "note");
    }
}
