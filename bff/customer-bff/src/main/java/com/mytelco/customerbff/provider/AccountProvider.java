package com.mytelco.customerbff.provider;

import org.springframework.stereotype.Component;

import com.mytelco.customerbff.model.AccountOverviewResponse;
import com.mytelco.customerbff.model.AccountSummary;
import com.mytelco.customerbff.operator.OperatorAdapterExecutor;

/**
 * Account provider facade delegating to operator adapters.
 */
@Component
public class AccountProvider {

    private final OperatorAdapterExecutor adapterExecutor;

    public AccountProvider(OperatorAdapterExecutor adapterExecutor) {
        this.adapterExecutor = adapterExecutor;
    }

    public AccountSummary getAccountSummary(String customerId) {
        return adapterExecutor.execute(
            customerId,
            "account.summary",
            adapter -> adapter.getAccountSummary(customerId)
        );
    }

    public AccountOverviewResponse getAccountOverview(String customerId) {
        return adapterExecutor.execute(
            customerId,
            "account.overview",
            adapter -> adapter.getAccountOverview(customerId)
        );
    }
}
