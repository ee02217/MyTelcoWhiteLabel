package com.mytelco.customerbff.operator;

import com.mytelco.customerbff.model.AccountOverviewResponse;
import com.mytelco.customerbff.model.AccountSummary;
import com.mytelco.customerbff.model.BillingSummary;
import com.mytelco.customerbff.model.CustomerUsageResponse;
import com.mytelco.customerbff.model.UsageSummary;
import com.mytelco.customerbff.model.UsageView;

/**
 * Standard adapter contract for integrating operator/BSS data sources.
 *
 * <p>All customer-facing account, usage, and billing retrieval in BFF should
 * pass through this contract so providers remain pluggable per operator.</p>
 */
public interface OperatorAdapter {

    /**
     * Stable adapter identifier for logging/diagnostics.
     */
    String adapterId();

    /**
     * Whether this adapter supports the provided operator id.
     */
    boolean supportsOperator(String operatorId);

    AccountSummary getAccountSummary(String customerId);

    AccountOverviewResponse getAccountOverview(String customerId);

    UsageSummary getUsageSummary(String customerId);

    CustomerUsageResponse getUsageDetails(String customerId, UsageView view, String lineId);

    BillingSummary getBillingSummary(String customerId);
}
