package com.mytelco.customerbff;

import com.mytelco.customerbff.model.CatalogConfirmSelectionRequest;
import com.mytelco.customerbff.model.CatalogConfirmSelectionResponse;
import com.mytelco.customerbff.model.CatalogResponse;
import com.mytelco.customerbff.service.CatalogEligibilityService;
import com.mytelco.customerbff.service.CatalogService;
import java.util.List;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CatalogServiceTest {

    private final CatalogService service = new CatalogService(new CatalogEligibilityService());

    @Test
    void getCatalog_shouldIncludePricingEffectiveDateAndTerms() {
        CatalogResponse response = service.getCatalog("line-22", "vodafone-pt", null);

        assertFalse(response.offers().isEmpty());
        assertTrue(response.offers().stream().allMatch(o -> o.pricing() != null && o.pricing().amount() != null));
        assertTrue(response.offers().stream().allMatch(o -> o.effectiveDate() != null && !o.effectiveDate().isBlank()));
        assertTrue(response.offers().stream().allMatch(o -> o.terms() != null && o.terms().reference() != null));
    }

    @Test
    void confirmSelection_shouldReturnTotalPriceAndTermsAcknowledgement() {
        CatalogConfirmSelectionResponse response = service.confirmSelection(
            new CatalogConfirmSelectionRequest(
                "line-22",
                "vodafone-pt",
                List.of("plan-starter-20", "addon-5g-boost"),
                true,
                "terms://catalog/confirm"
            )
        );

        assertEquals("19.98", response.totalPrice().amount().toPlainString());
        assertEquals(2, response.selectedItems().size());
        assertTrue(response.termsAcknowledgement().accepted());
        assertNotNull(response.termsAcknowledgement().acceptedAt());
    }
}
