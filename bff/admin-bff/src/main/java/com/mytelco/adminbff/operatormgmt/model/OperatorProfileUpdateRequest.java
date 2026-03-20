package com.mytelco.adminbff.operatormgmt.model;

import java.util.List;
import java.util.Map;

public record OperatorProfileUpdateRequest(
    String name,
    List<String> locales,
    Map<String, Map<String, Boolean>> featuresByChannel
) {
}
