package com.mytelco.customerbff.lines;

public record CancelLineRequest(
    String reason,
    boolean keepNumber,
    String feedback
) {}
