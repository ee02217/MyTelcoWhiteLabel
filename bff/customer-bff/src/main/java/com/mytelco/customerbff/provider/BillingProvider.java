package com.mytelco.customerbff.provider;

import com.mytelco.customerbff.model.*;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

/**
 * Provider for billing-related data.
 * In production, this would call the billing service.
 */
@Component
public class BillingProvider {

    /**
     * Retrieves billing summary for the given customer ID.
     */
    public BillingSummary getBillingSummary(String customerId) {
        return new BillingSummary(
            new BigDecimal("29.99"),
            new BigDecimal("49.99"),
            LocalDate.now().minusDays(15),
            LocalDate.now().plusDays(15),
            "Credit Card",
            true
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
