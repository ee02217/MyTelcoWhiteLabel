package com.mytelco.adminbff.operatormgmt.controller;

import com.mytelco.adminbff.operatormgmt.model.OperatorAuditEntry;
import com.mytelco.adminbff.operatormgmt.model.OperatorProfileResponse;
import com.mytelco.adminbff.operatormgmt.model.OperatorProfileUpdateRequest;
import com.mytelco.adminbff.operatormgmt.model.OperatorProfileUpdateResponse;
import com.mytelco.adminbff.operatormgmt.model.OperatorSummaryResponse;
import com.mytelco.adminbff.operatormgmt.model.OperatorUserResponse;
import com.mytelco.adminbff.operatormgmt.model.OperatorUserRolesUpdateRequest;
import com.mytelco.adminbff.operatormgmt.service.OperatorManagementService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/operators")
public class OperatorManagementController {

    private final OperatorManagementService operatorManagementService;

    public OperatorManagementController(OperatorManagementService operatorManagementService) {
        this.operatorManagementService = operatorManagementService;
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public List<OperatorSummaryResponse> listOperators() {
        return operatorManagementService.listOperators();
    }

    @GetMapping(value = "/{operatorId}/profile", produces = MediaType.APPLICATION_JSON_VALUE)
    public OperatorProfileResponse getProfile(@PathVariable String operatorId) {
        return operatorManagementService.getProfile(operatorId);
    }

    @PatchMapping(value = "/{operatorId}/profile", consumes = MediaType.APPLICATION_JSON_VALUE,
        produces = MediaType.APPLICATION_JSON_VALUE)
    public OperatorProfileUpdateResponse updateProfile(
        @PathVariable String operatorId,
        @RequestBody OperatorProfileUpdateRequest request,
        Principal principal
    ) {
        String actor = principal != null ? principal.getName() : "system";
        return operatorManagementService.updateProfile(operatorId, request, actor);
    }

    @GetMapping(value = "/{operatorId}/users", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<OperatorUserResponse> listUsers(@PathVariable String operatorId) {
        return operatorManagementService.listUsers(operatorId);
    }

    @PatchMapping(value = "/{operatorId}/users/{userId}/roles", consumes = MediaType.APPLICATION_JSON_VALUE,
        produces = MediaType.APPLICATION_JSON_VALUE)
    public OperatorUserResponse updateUserRoles(
        @PathVariable String operatorId,
        @PathVariable String userId,
        @Valid @RequestBody OperatorUserRolesUpdateRequest request,
        Principal principal
    ) {
        String actor = principal != null ? principal.getName() : "system";
        return operatorManagementService.updateUserRoles(operatorId, userId, request, actor);
    }

    @GetMapping(value = "/{operatorId}/audit", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<OperatorAuditEntry> audit(
        @PathVariable String operatorId,
        @RequestParam(value = "limit", required = false, defaultValue = "50") int limit
    ) {
        return operatorManagementService.audit(operatorId, limit);
    }
}
