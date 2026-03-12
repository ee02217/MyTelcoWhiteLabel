package com.mytelco.customerbff.service;

import com.mytelco.customerbff.model.*;
import com.mytelco.customerbff.provider.BillingProvider;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BillingExplorerService {

    private final BillingProvider billingProvider;

    public BillingExplorerService(BillingProvider billingProvider) {
        this.billingProvider = billingProvider;
    }

    public BillExplorerResponse getBillExplorer(String customerId, YearMonth period) {
        BillPeriodData current = billingProvider.getBillPeriodData(customerId, period);
        BillPeriodData previous = billingProvider.getBillPeriodData(customerId, period.minusMonths(1));

        List<BillCategoryGroup> groupedLineItems = groupByCategory(current.lineItems());
        Map<BillItemCategory, BigDecimal> totalsByCategory = groupedLineItems.stream()
            .collect(Collectors.toMap(BillCategoryGroup::category, BillCategoryGroup::total));

        BigDecimal grandTotal = totalsByCategory.values().stream()
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .setScale(2, RoundingMode.HALF_UP);

        BigDecimal previousTotal = previous.lineItems().stream()
            .map(BillLineItem::amount)
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .setScale(2, RoundingMode.HALF_UP);

        BigDecimal deltaAbsolute = grandTotal.subtract(previousTotal).setScale(2, RoundingMode.HALF_UP);
        BigDecimal deltaPercentage = previousTotal.compareTo(BigDecimal.ZERO) == 0
            ? BigDecimal.ZERO
            : deltaAbsolute
                .divide(previousTotal, 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"))
                .setScale(2, RoundingMode.HALF_UP);

        return new BillExplorerResponse(
            customerId,
            current.period(),
            current.periodStart(),
            current.periodEnd(),
            groupedLineItems,
            totalsByCategory,
            grandTotal,
            new BillPeriodComparison(
                new BillPeriodSummary(previous.period(), previousTotal),
                deltaAbsolute,
                deltaPercentage
            ),
            current.invoice()
        );
    }

    List<BillCategoryGroup> groupByCategory(List<BillLineItem> lineItems) {
        Map<BillItemCategory, List<BillLineItem>> grouped = lineItems.stream()
            .collect(Collectors.groupingBy(BillLineItem::category, () -> new EnumMap<>(BillItemCategory.class), Collectors.toList()));

        return Arrays.stream(BillItemCategory.values())
            .map(category -> {
                List<BillLineItem> items = grouped.getOrDefault(category, List.of());
                BigDecimal total = items.stream()
                    .map(BillLineItem::amount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);
                return new BillCategoryGroup(category, items, total);
            })
            .toList();
    }
}
