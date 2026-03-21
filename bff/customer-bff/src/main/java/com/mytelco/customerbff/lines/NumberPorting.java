package com.mytelco.customerbff.lines;

public record NumberPorting(
    String status,
    String donorOperator,
    String requestedAt,
    String estimatedCompletion,
    String otp,
    boolean otpVerified
) {}
