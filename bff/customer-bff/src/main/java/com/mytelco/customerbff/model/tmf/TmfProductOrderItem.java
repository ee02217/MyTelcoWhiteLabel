package com.mytelco.customerbff.model.tmf;

public record TmfProductOrderItem(
    String id,
    String action,
    String state,
    TmfProductRef product
) {}
