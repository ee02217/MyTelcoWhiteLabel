package com.mytelco.adminbff.content.model;

public record ContentRollbackRequest(
    String locale,
    Integer version
) {
}
