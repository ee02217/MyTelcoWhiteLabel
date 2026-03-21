package com.mytelco.customerbff.family;

public record FamilyRoleUpdateRequest(
    FamilyRole role,
    String note
) {
}
