package com.mytelco.customerbff.family;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record FamilyRolesResponse(
    String accountOwnerCustomerId,
    String actingLineId,
    FamilyRole actingRole,
    List<FamilyPermission> actingPermissions,
    List<FamilyRoleEntry> assignments,
    Map<FamilyRole, List<FamilyPermission>> permissionMatrix,
    Instant generatedAt
) {
}
