package com.mytelco.customerbff;

import com.mytelco.customerbff.model.*;
import com.mytelco.customerbff.provider.BillingProvider;
import com.mytelco.customerbff.service.BillingExplorerService;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class BillingExplorerServiceTest {

    @Test
    void getBillExplorer_shouldGroupByRequiredCategories_andComputeComparison() {
        BillingProvider provider = mock(BillingProvider.class);
        BillingExplorerService service = new BillingExplorerService(provider);

        YearMonth period = YearMonth.of(2026, 3);
        when(provider.getBillPeriodData("12345", period)).thenReturn(new BillPeriodData(
            "2026-03",
            LocalDate.of(2026, 3, 1),
            LocalDate.of(2026, 3, 31),
            List.of(
                new BillLineItem("1", "Plan", new BigDecimal("30.00"), BillItemCategory.PLAN),
                new BillLineItem("2", "Addon", new BigDecimal("5.00"), BillItemCategory.ADD_ONS),
                new BillLineItem("3", "Overage", new BigDecimal("2.00"), BillItemCategory.OVERAGES),
                new BillLineItem("4", "Tax", new BigDecimal("8.00"), BillItemCategory.TAXES)
            ),
            new InvoiceMetadata("INV-1", "INV-1.pdf", "/download/INV-1")
        ));

        when(provider.getBillPeriodData("12345", period.minusMonths(1))).thenReturn(new BillPeriodData(
            "2026-02",
            LocalDate.of(2026, 2, 1),
            LocalDate.of(2026, 2, 28),
            List.of(
                new BillLineItem("1", "Plan", new BigDecimal("30.00"), BillItemCategory.PLAN),
                new BillLineItem("2", "Addon", new BigDecimal("2.00"), BillItemCategory.ADD_ONS),
                new BillLineItem("3", "Overage", new BigDecimal("1.00"), BillItemCategory.OVERAGES),
                new BillLineItem("4", "Tax", new BigDecimal("7.00"), BillItemCategory.TAXES)
            ),
            new InvoiceMetadata("INV-2", "INV-2.pdf", "/download/INV-2")
        ));

        BillExplorerResponse response = service.getBillExplorer("12345", period);

        assertEquals(4, response.groupedLineItems().size());
        assertEquals(new BigDecimal("30.00"), response.totalsByCategory().get(BillItemCategory.PLAN));
        assertEquals(new BigDecimal("5.00"), response.totalsByCategory().get(BillItemCategory.ADD_ONS));
        assertEquals(new BigDecimal("2.00"), response.totalsByCategory().get(BillItemCategory.OVERAGES));
        assertEquals(new BigDecimal("8.00"), response.totalsByCategory().get(BillItemCategory.TAXES));

        assertEquals(new BigDecimal("45.00"), response.grandTotal());
        assertEquals(new BigDecimal("40.00"), response.comparison().previous().grandTotal());
        assertEquals(new BigDecimal("5.00"), response.comparison().deltaAbsolute());
        assertEquals(new BigDecimal("12.50"), response.comparison().deltaPercentage());
    }
}
