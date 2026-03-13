package com.mytelco.customerbff;

import com.mytelco.customerbff.model.RoamingPackPurchaseRequest;
import com.mytelco.customerbff.provider.RoamingProvider;
import com.mytelco.customerbff.service.RoamingService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class RoamingServiceTest {

    @Test
    void purchaseUpdatesAllowanceAndValidityWindow() {
        RoamingService service = new RoamingService(new RoamingProvider());

        var result = service.purchase(new RoamingPackPurchaseRequest("line-9", "pt", "pack-weekly-1gb"));

        assertTrue(result.updatedAllowanceGb() >= 1);
        assertTrue(result.validUntil().isAfter(result.validFrom()));
    }
}
