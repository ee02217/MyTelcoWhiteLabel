package com.mytelco.adminbff.configflags.model;

import jakarta.validation.constraints.NotNull;

public record FlagUpdateRequest(
    @NotNull Boolean enabled
) {
}
