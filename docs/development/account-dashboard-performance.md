# Account Dashboard Performance Baseline (F-05.1)

## Objective

For MVP, the account dashboard initial load target is:

- **p95 < 2.5s on average 4G conditions**

This objective applies to the BFF-backed account overview flow.

## Endpoint Under Measurement

- `GET /api/v1/customer/account-overview`

Response contract includes:

- `plan`
- `activeLines[]`
- `activeLineCount`
- `nextBillDate`
- `outstandingAmount`
- `accountType`
- `lineStructure` (`SINGLE_LINE` or `MULTI_LINE_READY`)

## Instrumentation Added

In `customer-bff`:

- `customer.account.overview.endpoint` (controller-level timer)
- `customer.account.overview.aggregation` (service-level timer)

Both publish percentiles including p95.

## Stage Measurement Approach

1. Deploy `customer-bff` with actuator metrics enabled.
2. Generate synthetic dashboard traffic representative of customer sessions.
3. Capture p95 for `customer.account.overview.endpoint` from Micrometer/Prometheus.
4. Correlate endpoint p95 with frontend page-load telemetry under 4G-like throttling.

Recommended load profile for baseline:

- Warm-up: 2 minutes
- Sustained: 10 minutes
- Concurrency: 20–50 virtual users (tune by environment size)

## Current Local Baseline (MVP Stub)

Local runs with stubbed providers are significantly under the target and primarily CPU-local. This is **not representative** of production latency.

Current limitations:

- No real downstream service/network hops
- No real mobile radio variability
- Minimal payload size and no account history joins

Therefore, this baseline only confirms instrumentation and endpoint contract readiness.
