package com.mytelco.customerbff.billing;

public record Invoice(
    String invoiceId,
    String invoiceNumber,
    String customerId,
    String lineId,
    String periodStart,
    String periodEnd,
    String issueDate,
    String dueDate,
    double amount,
    String currency,
    String status,
    String pdfUrl
) {}
