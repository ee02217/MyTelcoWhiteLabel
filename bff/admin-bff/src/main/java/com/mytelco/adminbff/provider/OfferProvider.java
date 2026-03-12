package com.mytelco.adminbff.provider;

import com.mytelco.adminbff.model.OfferSummary;
import org.springframework.stereotype.Component;

/**
 * Provider for offer-related data.
 * In production, this would call the offer management service.
 */
@Component
public class OfferProvider {

    /**
     * Retrieves offer summary for the admin dashboard.
     */
    public OfferSummary getOfferSummary() {
        // Stub implementation
        return new OfferSummary(
            25,
            18,
            5,
            2,
            "Premium Unlimited",
            12.5
        );
    }
}
