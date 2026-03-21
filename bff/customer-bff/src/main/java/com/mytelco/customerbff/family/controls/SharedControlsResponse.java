package com.mytelco.customerbff.family.controls;

import com.mytelco.customerbff.family.FamilyRole;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record SharedControlsResponse(
    String actingLineId,
    FamilyRole actingRole,
    List<SharedControlCap> caps,
    List<SharedControlUsage> usage,
    List<SharedControlAlert> alerts,
    List<SharedControlOverrideRequest> overrideRequests,
    Map<String, String> roleByLine,
    Instant generatedAt
) {
}
