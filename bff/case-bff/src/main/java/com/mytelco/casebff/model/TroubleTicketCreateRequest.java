package com.mytelco.casebff.model;

import jakarta.validation.constraints.NotBlank;

public record TroubleTicketCreateRequest(
    @NotBlank String category,
    @NotBlank String title,
    @NotBlank String description,
    String priority,
    String affectedServiceId
) {}
