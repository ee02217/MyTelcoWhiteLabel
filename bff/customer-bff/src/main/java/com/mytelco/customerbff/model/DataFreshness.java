package com.mytelco.customerbff.model;

import java.time.Instant;

public record DataFreshness(
    Instant asOf,
    String sla
) {}
