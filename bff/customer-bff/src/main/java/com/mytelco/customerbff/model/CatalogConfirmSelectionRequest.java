package com.mytelco.customerbff.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record CatalogConfirmSelectionRequest(
    @NotBlank String lineId,
    @NotBlank String operatorId,
    @NotEmpty List<String> selectedOfferIds,
    boolean termsAccepted,
    String termsReference
) {
}
