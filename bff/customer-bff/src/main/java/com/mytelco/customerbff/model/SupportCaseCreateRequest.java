package com.mytelco.customerbff.model;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record SupportCaseCreateRequest(
    @NotBlank String category,
    @NotBlank String subject,
    @NotBlank String description,
    String priority,
    List<SupportCaseAttachment> attachments
) {}
