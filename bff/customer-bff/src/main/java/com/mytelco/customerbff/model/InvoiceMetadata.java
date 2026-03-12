package com.mytelco.customerbff.model;

public record InvoiceMetadata(
    String invoiceId,
    String fileName,
    String downloadUrl
) {
}
