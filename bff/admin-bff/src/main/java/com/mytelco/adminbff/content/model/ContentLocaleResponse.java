package com.mytelco.adminbff.content.model;

import java.util.List;

public record ContentLocaleResponse(
    String contentId,
    String locale,
    ContentVersionResponse current,
    List<ContentVersionResponse> history
) {
}
