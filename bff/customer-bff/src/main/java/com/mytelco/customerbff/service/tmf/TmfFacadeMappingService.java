package com.mytelco.customerbff.service.tmf;

import com.mytelco.customerbff.model.AccountSummary;
import com.mytelco.customerbff.model.BillingSummary;
import com.mytelco.customerbff.model.CatalogOffer;
import com.mytelco.customerbff.model.CustomerOrderResponse;
import com.mytelco.customerbff.model.tmf.TmfAccount;
import com.mytelco.customerbff.model.tmf.TmfBill;
import com.mytelco.customerbff.model.tmf.TmfMoney;
import com.mytelco.customerbff.model.tmf.TmfProductOffering;
import com.mytelco.customerbff.model.tmf.TmfProductOrder;
import com.mytelco.customerbff.model.tmf.TmfProductOrderItem;
import com.mytelco.customerbff.model.tmf.TmfProductRef;
import com.mytelco.customerbff.model.tmf.TmfRelatedParty;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class TmfFacadeMappingService {

    public TmfProductOffering toProductOffering(CatalogOffer offer) {
        return new TmfProductOffering(
            offer.offerId(),
            "/tmf-api/productCatalogManagement/v4/productOffering/" + offer.offerId(),
            offer.name(),
            offer.terms().summary(),
            offer.eligible() ? "active" : "suspended",
            List.of(new TmfMoney(offer.pricing().amount(), offer.pricing().currency())),
            "ProductOffering"
        );
    }

    public TmfProductOrder toProductOrder(CustomerOrderResponse order, String externalId) {
        return new TmfProductOrder(
            order.orderId(),
            "/tmf-api/productOrderingManagement/v4/productOrder/" + order.orderId(),
            externalId,
            order.state().name(),
            new TmfProductOrderItem(
                "1",
                order.itemType(),
                order.state().name(),
                new TmfProductRef(order.itemCode(), "/tmf-api/productCatalogManagement/v4/productOffering/" + order.itemCode(), order.itemCode(), "ProductOffering")
            ),
            "ProductOrder"
        );
    }

    public TmfAccount toAccount(AccountSummary accountSummary) {
        return new TmfAccount(
            accountSummary.accountId(),
            "/tmf-api/accountManagement/v4/account/" + accountSummary.accountId(),
            accountSummary.planName(),
            accountSummary.accountStatus(),
            new TmfRelatedParty(accountSummary.primaryMsisdn(), "customer", accountSummary.primaryMsisdn(), "Individual"),
            "Account"
        );
    }

    public TmfBill toBill(String billId, BillingSummary billingSummary) {
        return new TmfBill(
            billId,
            "/tmf-api/billingManagement/v4/bill/" + billId,
            "issued",
            new TmfMoney(billingSummary.currentBalance(), "EUR"),
            billingSummary.nextPaymentDueDate().toString(),
            "Bill"
        );
    }
}
