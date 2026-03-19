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

## Docker Measurement Approach (constrained profile)

In docker-only runtime, use the repeatable constrained profile script:

```bash
bash scripts/docker-dashboard-load-evidence.sh
```

What it does:

1. Ensures local docker stack is running.
2. Resolves current SPA asset bundle paths from `http://localhost:3000/`.
3. Acquires access token from local Keycloak.
4. Runs `N=30` measurements (default) over:
   - HTML
   - main JS bundle
   - main CSS bundle
   - authenticated `GET /api/v1/customer/account-overview`
5. Applies constrained profile model:
   - throughput cap: `1250 KB/s` (~10 Mbps)
   - synthetic RTT component: `150ms * 4 requests`
6. Exports median/p95/pass-rate against `< 2.5s`.

Artifacts are written to `evidence/YYYY-MM-DD/`:

- `docker-dashboard-load-runs-<timestamp>.csv`
- `docker-dashboard-load-summary-<timestamp>.md`

## Limitations

This is a **docker-constrained approximation**, not full radio/browser telemetry.

Known gaps vs true mobile 4G conditions:

- no real cellular jitter/packet loss profile
- no browser CPU contention/hydration trace capture
- no multi-hop external dependency variance

Use this as docker-gated evidence; escalate to real device/network profiling before external SLO claims.
