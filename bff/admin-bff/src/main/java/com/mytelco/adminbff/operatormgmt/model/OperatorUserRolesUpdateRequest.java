package com.mytelco.adminbff.operatormgmt.model;

import jakarta.validation.constraints.NotEmpty;

import java.util.Set;

public record OperatorUserRolesUpdateRequest(
    @NotEmpty Set<String> roles,
    Boolean enabled
) {
}
