package com.mytelco.customerbff.model;

import java.util.List;

public record CatalogConfirmSelectionResponse(
    String lineId,
    String operatorId,
    CatalogOfferPrice totalPrice,
    List<CatalogSelectedItem> selectedItems,
    CatalogTermsAcknowledgement termsAcknowledgement
) {
}
