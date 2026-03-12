package com.mytelco.customerbff.service;

import com.mytelco.customerbff.model.CatalogConfirmSelectionRequest;
import com.mytelco.customerbff.model.CatalogConfirmSelectionResponse;
import com.mytelco.customerbff.model.CatalogOffer;
import com.mytelco.customerbff.model.CatalogOfferPrice;
import com.mytelco.customerbff.model.CatalogOfferTerms;
import com.mytelco.customerbff.model.CatalogOfferType;
import com.mytelco.customerbff.model.CatalogResponse;
import com.mytelco.customerbff.model.CatalogSelectedItem;
import com.mytelco.customerbff.model.CatalogTermsAcknowledgement;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class CatalogService {

    private final CatalogEligibilityService eligibilityService;

    public CatalogService(CatalogEligibilityService eligibilityService) {
        this.eligibilityService = eligibilityService;
    }

    public CatalogResponse getCatalog(String lineId, String operatorId, String type) {
        List<CatalogOffer> baseOffers = seededOffers().stream()
            .map(offer -> {
                CatalogEligibilityService.EligibilityResult result =
                    eligibilityService.evaluate(lineId, operatorId, offer.offerId());
                return new CatalogOffer(
                    offer.offerId(),
                    offer.name(),
                    offer.type(),
                    result.eligible(),
                    result.reason(),
                    offer.pricing(),
                    offer.effectiveDate(),
                    offer.terms()
                );
            })
            .collect(Collectors.toList());

        if (type == null || type.isBlank()) {
            return new CatalogResponse(lineId, operatorId, baseOffers);
        }

        CatalogOfferType filter = CatalogOfferType.valueOf(type.toUpperCase(Locale.ROOT));
        List<CatalogOffer> filtered = baseOffers.stream()
            .filter(offer -> offer.type() == filter)
            .collect(Collectors.toList());

        return new CatalogResponse(lineId, operatorId, filtered);
    }

    public CatalogConfirmSelectionResponse confirmSelection(CatalogConfirmSelectionRequest request) {
        List<CatalogOffer> eligibleCatalog = getCatalog(request.lineId(), request.operatorId(), null).offers().stream()
            .filter(CatalogOffer::eligible)
            .collect(Collectors.toList());

        List<CatalogSelectedItem> selected = eligibleCatalog.stream()
            .filter(offer -> request.selectedOfferIds().contains(offer.offerId()))
            .map(offer -> new CatalogSelectedItem(
                offer.offerId(),
                offer.name(),
                offer.type(),
                offer.pricing(),
                offer.effectiveDate(),
                offer.terms()
            ))
            .collect(Collectors.toList());

        BigDecimal total = selected.stream()
            .map(item -> item.pricing().amount())
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new CatalogConfirmSelectionResponse(
            request.lineId(),
            request.operatorId(),
            new CatalogOfferPrice(total, "EUR"),
            selected,
            new CatalogTermsAcknowledgement(
                request.termsAccepted(),
                request.termsReference(),
                OffsetDateTime.now().toString()
            )
        );
    }

    private List<CatalogOffer> seededOffers() {
        return List.of(
            new CatalogOffer(
                "plan-starter-20",
                "Starter 20GB",
                CatalogOfferType.PLAN,
                true,
                "eligible",
                new CatalogOfferPrice(new BigDecimal("14.99"), "EUR"),
                "2026-04-01",
                new CatalogOfferTerms("24-month commitment", "terms://plans/starter-20")
            ),
            new CatalogOffer(
                "plan-premium-unlimited",
                "Premium Unlimited 5G",
                CatalogOfferType.PLAN,
                true,
                "eligible",
                new CatalogOfferPrice(new BigDecimal("29.99"), "EUR"),
                "2026-04-01",
                new CatalogOfferTerms("24-month commitment + fair-use policy", "terms://plans/premium-unlimited")
            ),
            new CatalogOffer(
                "addon-5g-boost",
                "5G Boost",
                CatalogOfferType.ADDON,
                true,
                "eligible",
                new CatalogOfferPrice(new BigDecimal("4.99"), "EUR"),
                "2026-04-01",
                new CatalogOfferTerms("Monthly recurring add-on", "terms://addons/5g-boost")
            ),
            new CatalogOffer(
                "addon-roaming-weekly",
                "EU Roaming Weekly",
                CatalogOfferType.ADDON,
                true,
                "eligible",
                new CatalogOfferPrice(new BigDecimal("6.99"), "EUR"),
                "2026-04-01",
                new CatalogOfferTerms("Auto-renews every 7 days", "terms://addons/roaming-weekly")
            )
        );
    }
}
