package com.mytelco.customerbff.model;

import java.time.Instant;
import java.util.List;

public record SupportCaseResponse(
    String caseId,
    String category,
    String subject,
    String description,
    String priority,
    SupportCaseStatus status,
    Instant createdAt,
    Instant updatedAt,
    String slaTarget,
    Instant expectedResponseAt,
    List<SupportCaseAttachment> attachments,
    List<SupportCaseTimelineEntry> timeline
) {}
