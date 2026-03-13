package com.mytelco.customerbff.model;

import jakarta.validation.constraints.NotBlank;

public record SupportCaseAttachment(
    @NotBlank String fileName,
    @NotBlank String contentType,
    long sizeBytes,
    String url
) {}
