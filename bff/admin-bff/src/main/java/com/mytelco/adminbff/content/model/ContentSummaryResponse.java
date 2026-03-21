package com.mytelco.adminbff.content.model;

import java.util.List;

public record ContentSummaryResponse(
    String contentId,
    List<ContentLocaleSummary> locales
) {
}
