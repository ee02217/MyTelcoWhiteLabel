# Operator Adapters (F-09.2)

## Objective

Define a pluggable adapter contract so the customer BFF can integrate multiple operator/BSS backends without changing core aggregation logic.

## Contract standard

Interface:

- `com.mytelco.customerbff.operator.OperatorAdapter`

Required operations:

- `getAccountSummary(customerId)`
- `getAccountOverview(customerId)`
- `getUsageSummary(customerId)`
- `getUsageDetails(customerId, view, lineId)`
- `getBillingSummary(customerId)`

Selection model:

- Adapter exposes `adapterId()` for diagnostics
- Adapter exposes `supportsOperator(operatorId)` for routing
- `OperatorAdapterRegistry` resolves adapter by operator id

Routing model:

- `OperatorContextResolver` maps customer to operator id
- Defaults to `mytelco.operator.default-operator-id`
- Optional per-customer override map: `mytelco.operator.customer-operator-overrides`

## Reference adapter (end-to-end)

Implemented reference adapter:

- `StubPortugalOperatorAdapter` (`operator-stub-pt`)

This adapter serves account/usage/billing for customer dashboard and account overview flows end-to-end in local/docker runtime.

## Error mapping standard

Mapped by `OperatorAdapterErrorMapper` to `OperatorAdapterException` with explicit code:

- `UPSTREAM_TIMEOUT`
- `UPSTREAM_UNAVAILABLE`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `VALIDATION`
- `INTERNAL`

All provider calls are normalized through this mapping before propagating to services/controllers.

## Retry policy standard

Applied centrally by `OperatorAdapterExecutor`:

- max attempts: `mytelco.operator.retry.max-attempts`
- initial backoff: `mytelco.operator.retry.initial-backoff`
- multiplier: `mytelco.operator.retry.multiplier`
- max backoff: `mytelco.operator.retry.max-backoff`

Only retryable mapped failures are retried.

## Configuration

`bff/customer-bff/src/main/resources/application.yml`

```yaml
mytelco:
  operator:
    default-operator-id: ${MYTELCO_OPERATOR_DEFAULT_ID:operator-stub-pt}
    customer-operator-overrides: {}
    retry:
      max-attempts: ${MYTELCO_OPERATOR_RETRY_MAX_ATTEMPTS:3}
      initial-backoff: ${MYTELCO_OPERATOR_RETRY_INITIAL_BACKOFF:80ms}
      multiplier: ${MYTELCO_OPERATOR_RETRY_MULTIPLIER:2.0}
      max-backoff: ${MYTELCO_OPERATOR_RETRY_MAX_BACKOFF:PT1S}
```

## Extension path (new operator)

1. Implement `OperatorAdapter` for new operator/BSS.
2. Add `supportsOperator("operator-<id>")` logic.
3. Add routing entry via `customer-operator-overrides` (or future routing source).
4. Validate dashboard/account endpoints and adapter error mapping behavior.

This keeps core BFF aggregation services unchanged while onboarding new operators.
