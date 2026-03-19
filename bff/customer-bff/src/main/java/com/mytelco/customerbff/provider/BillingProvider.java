package com.mytelco.customerbff.provider;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import com.mytelco.customerbff.model.BillItemCategory;
import com.mytelco.customerbff.model.BillLineItem;
import com.mytelco.customerbff.model.BillPeriodData;
import com.mytelco.customerbff.model.BillingSummary;
import com.mytelco.customerbff.model.InvoiceMetadata;
import com.mytelco.customerbff.operator.OperatorAdapterExecutor;

/**
 * Billing provider facade.
 *
 * <p>Billing summary is adapter-backed to support operator pluggability.
 * Detailed bill explorer endpoints remain local stubbed behavior for MVP.</p>
 */
@Component
public class BillingProvider {

    private final OperatorAdapterExecutor adapterExecutor;

    public BillingProvider(OperatorAdapterExecutor adapterExecutor) {
        this.adapterExecutor = adapterExecutor;
    }

    public BillingSummary getBillingSummary(String customerId) {
        return adapterExecutor.execute(
            customerId,
            "billing.summary",
            adapter -> adapter.getBillingSummary(customerId)
        );
    }

    public BillPeriodData getBillPeriodData(String customerId, YearMonth period) {
        boolean currentPeriod = period.equals(YearMonth.now());
        List<BillLineItem> items = currentPeriod
            ? List.of(
                new BillLineItem("ITEM-PLAN-1", "Unlimited Max Plan", new BigDecimal("34.99"), BillItemCategory.PLAN),
                new BillLineItem("ITEM-ADDON-1", "International Calls Pack", new BigDecimal("4.99"), BillItemCategory.ADD_ONS),
                new BillLineItem("ITEM-OVERAGE-1", "Roaming Data Overage", new BigDecimal("3.50"), BillItemCategory.OVERAGES),
                new BillLineItem("ITEM-TAX-1", "VAT 23%", new BigDecimal("9.99"), BillItemCategory.TAXES)
            )
            : List.of(
                new BillLineItem("ITEM-PLAN-1", "Unlimited Max Plan", new BigDecimal("34.99"), BillItemCategory.PLAN),
                new BillLineItem("ITEM-ADDON-1", "International Calls Pack", new BigDecimal("2.99"), BillItemCategory.ADD_ONS),
                new BillLineItem("ITEM-OVERAGE-1", "Roaming Data Overage", new BigDecimal("1.75"), BillItemCategory.OVERAGES),
                new BillLineItem("ITEM-TAX-1", "VAT 23%", new BigDecimal("8.83"), BillItemCategory.TAXES)
            );

        String invoiceId = "INV-" + period.toString().replace("-", "") + "-" + customerId;
        return new BillPeriodData(
            period.toString(),
            period.atDay(1),
            period.atEndOfMonth(),
            items,
            new InvoiceMetadata(
                invoiceId,
                invoiceId + ".pdf",
                "/api/v1/customer/billing/invoice/" + invoiceId + "/download"
            )
        );
    }

    public Resource getInvoicePdf(String invoiceId) {
        return new ClassPathResource("invoices/sample-invoice.pdf");
    }
}
