package com.mytelco.customerbff.model;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record AlertThresholdConfigUpdateRequest(
    @NotNull @NotEmpty List<Integer> thresholds
) {}
