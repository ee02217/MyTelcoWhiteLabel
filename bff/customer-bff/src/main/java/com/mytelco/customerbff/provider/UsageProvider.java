package com.mytelco.customerbff.provider;

import org.springframework.stereotype.Component;

import com.mytelco.customerbff.model.CustomerUsageResponse;
import com.mytelco.customerbff.model.UsageSummary;
import com.mytelco.customerbff.model.UsageView;
import com.mytelco.customerbff.operator.OperatorAdapterExecutor;

/**
 * Usage provider facade delegating to operator adapters.
 */
@Component
public class UsageProvider {

    private final OperatorAdapterExecutor adapterExecutor;

    public UsageProvider(OperatorAdapterExecutor adapterExecutor) {
        this.adapterExecutor = adapterExecutor;
    }

    public UsageSummary getUsageSummary(String customerId) {
        return adapterExecutor.execute(
            customerId,
            "usage.summary",
            adapter -> adapter.getUsageSummary(customerId)
        );
    }

    public CustomerUsageResponse getUsageDetails(String customerId, UsageView view, String lineId) {
        return adapterExecutor.execute(
            customerId,
            "usage.details",
            adapter -> adapter.getUsageDetails(customerId, view, lineId)
        );
    }
}
