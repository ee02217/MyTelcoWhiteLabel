package com.mytelco.customerbff.model;

import java.time.Instant;

public record SupportCaseTimelineEntry(
    String entryId,
    Instant timestamp,
    String actor,
    String actorType,
    String type,
    String message
) {}
