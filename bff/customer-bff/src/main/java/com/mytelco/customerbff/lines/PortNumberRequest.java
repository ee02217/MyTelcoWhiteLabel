package com.mytelco.customerbff.lines;

public record PortNumberRequest(
    String phoneNumber,
    String donorOperator,
    String accountNumber,
    String otp
) {}
