package com.mytelco.customerbff;

import com.mytelco.customerbff.service.CatalogEligibilityService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CatalogEligibilityServiceTest {

    private final CatalogEligibilityService service = new CatalogEligibilityService();

    @Test
    void evaluate_shouldMarkPremiumPlanIneligibleForNonVodafoneOperator() {
        CatalogEligibilityService.EligibilityResult result =
            service.evaluate("line-22", "other-operator", "plan-premium-unlimited");

        assertFalse(result.eligible());
    }

    @Test
    void evaluate_shouldMark5gAddonIneligibleForOddLine() {
        CatalogEligibilityService.EligibilityResult result =
            service.evaluate("line-21", "vodafone-pt", "addon-5g-boost");

        assertFalse(result.eligible());
    }

    @Test
    void evaluate_shouldAllowStarterPlan() {
        CatalogEligibilityService.EligibilityResult result =
            service.evaluate("line-21", "vodafone-pt", "plan-starter-20");

        assertTrue(result.eligible());
    }
}
