# Usage Threshold Alerts (F-05.3)

## Overview

F-05.3 introduces configurable threshold alerts for customer data usage with two channels:

- In-app inbox entries (`GET /api/v1/customer/alerts/inbox`)
- Push notifications via provider abstraction (`PushNotificationDispatcher`)

## Threshold model and defaults

Threshold configuration is customer-scoped and exposed via:

- `GET /api/v1/customer/alerts/thresholds`
- `PUT /api/v1/customer/alerts/thresholds`

Default thresholds: `[80, 100]`.

Payload (current MVP):

- `thresholds: number[]` (1..100, normalized/sorted)
- `dedupTtlMinutes: number`
- `updatedAt`, `updatedBy`

## Dedup rules and TTL

Dedup key:
`customerId | lineId | service | threshold`

Rule:

- Alert is emitted only if no alert exists for the same dedup key inside the TTL window.
- TTL is configurable with `alerts.dedup.ttl-minutes` (default `360` minutes).

This prevents repeated polling/evaluation cycles from spamming users for already-crossed thresholds.

## In-app and push flow

1. Usage endpoint (`/api/v1/customer/usage`) returns usage payload from provider.
2. `UsageThresholdAlertService` evaluates each line's data usage against configured thresholds.
3. For each crossing not blocked by dedup:
   - Add in-app entry via `AlertInboxService`.
   - Dispatch push payload via `PushNotificationDispatcher` (stubbed implementation logs payload).
4. Endpoint response includes `thresholdCrossings` for immediate UI status rendering.

## Operational caveats (MVP)

- Storage is in-memory (config, inbox, dedup state). Data resets on restart.
- Data allowance is currently fixed for evaluation (`10,000 MB` per line) and should be replaced by actual plan allowances.
- Push provider is a stub and must be replaced with real APNs/FCM/operator gateway integration for production.

## Future integration recommendations

- Persist threshold config/inbox/dedup in durable storage (Redis/PostgreSQL).
- Introduce billing-cycle/window identifiers in dedup key for precise lifecycle control.
- Integrate with Notification service bus (event-driven fan-out).
- Add per-service thresholds (voice/SMS) and per-line override UX.
