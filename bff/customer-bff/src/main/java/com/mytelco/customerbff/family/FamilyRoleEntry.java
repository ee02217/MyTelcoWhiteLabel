package com.mytelco.customerbff.family;

import java.util.List;

public record FamilyRoleEntry(
    String lineId,
    String msisdn,
    String nickname,
    String status,
    FamilyRole role,
    List<FamilyPermission> permissions
) {
}
