# Order Orchestration (F-07.2)

This document describes the MVP implementation of customer order orchestration in the `customer-bff` module.

## Endpoints

Base path: `/api/v1/customer/orders`

- `POST /api/v1/customer/orders`
  - Creates a plan/add-on order.
  - Supports idempotency via `Idempotency-Key` request header or `idempotencyKey` field in payload.
- `GET /api/v1/customer/orders/{orderId}`
  - Returns the current state and metadata for one order.
- `GET /api/v1/customer/orders?lineId=<id>`
  - Returns all orders associated with a line.

## State Machine

Order states are explicit and validated:

- `PENDING`
- `PROCESSING`
- `COMPLETED`
- `FAILED`

Allowed transitions:

- `PENDING -> PROCESSING`
- `PROCESSING -> COMPLETED`
- `PROCESSING -> FAILED`

No transition is allowed from terminal states (`COMPLETED`, `FAILED`). Invalid transitions throw an error in the orchestration service.

## Idempotency Semantics

Order submission is idempotent by key:

- First request with key `K` creates and persists the logical order result.
- Repeated request with the same key `K` returns the existing order response (`orderId`, `state`, rollback flag, notification message).
- If the key is missing in both header and payload, the request is rejected (`400`).

Priority rule:

1. `Idempotency-Key` header (if present)
2. request body `idempotencyKey`

## Rollback Strategy (MVP)

When downstream provisioning is simulated to fail (e.g., `simulateFailure=true` or `itemCode=FAIL`):

- The order transitions to `FAILED`.
- `rollbackApplied` is set to `true`.
- The response includes a failure message indicating rollback applied.

In MVP this is an in-memory compensating marker (no external provider undo call yet).

## Notification Behavior

Order outcomes are added to the existing alerts inbox (`/api/v1/customer/alerts/inbox`) using service tag `ORDER`:

- Success notification (`ORDER_COMPLETED` actor)
- Failure notification (`ORDER_FAILED` actor)

This makes failed orders user-visible in existing notification surfaces.

## Tests Covered

Backend tests added for:

1. State transition validation (invalid transitions rejected)
2. Idempotent create behavior (`same key -> same order`)
3. Failure path (`FAILED` + `rollbackApplied=true` + notification emitted)
4. Controller/API contract test for `GET /api/v1/customer/orders/{orderId}`

## Known MVP Limitations

- Storage is in-memory (non-durable across restarts).
- No distributed idempotency lock (single-instance safety only).
- Rollback is a compensating marker, not a real external reversal workflow.
- Notifications reuse generic alert schema (not yet a dedicated order-notification model).
