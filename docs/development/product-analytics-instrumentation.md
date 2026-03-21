# Product Analytics Instrumentation (F-11.2)

This delivery instruments the customer journey with a lightweight analytics service that records funnel events, exposes a dashboard API, and emits analytics events into the event backbone for downstream consumers.

## APIs

| Endpoint | Description |
| --- | --- |
| `GET /api/v1/customer/analytics/taxonomy` | Returns the approved event taxonomy, including funnels, steps, and owners. Rendering UI components should map cards to these entries. |
| `GET /api/v1/customer/analytics/dashboard` | Returns recent analytics events (default 200), funnel counts, and aggregates by operator/channel. Supports optional `operatorId`, `channel`, and `limit` query params. |

## Instrumentation points

The following customer-facing flows now emit analytics events whenever a customer executes them (headers documented below):

1. **Dashboard / Overview** (`CustomerDashboardController`) — records `auth.login.success` when the dashboard or account overview endpoints are read. This gives us an upstream indicator of who reached the authenticated experience.
2. **Plan change / catalog selection** (`CatalogController`) — the confirm-selection flow emits a `plan_change.selection.confirmed` event with selected offer counts, accepted terms, operator, and line context.
3. **Bill payments** (`PaymentJourneyController`) — starts with `billing.billpay.checkout.started` before the backend checkout call, and emits `billing.billpay.checkout.completed` afterwards (status + transaction ID) for success/failure analysis.
4. **Support cases** (`SupportCaseController`) — emits `support.case.created` when a customer opens a ticket.

All instrumented endpoints look for the following headers and adapt the analytics metadata:

- `X-Operator-ID` — overrides the derived operator (if present). Otherwise, we use the operator adapter resolver.
- `X-Channel` — indicates the customer channel (web, mobile, admin). Defaults to `web` when missing.
- `X-Correlation-ID` — ensures the analytics event matches the request trace handled by the observability stack.

Authentication is still enforced via Keycloak; events are emitted only after the request is authenticated and the customer ID is resolved.

## Backing service

`ProductAnalyticsService` retains the most recent 5,000 events in memory, increments Micrometer counters tagged by funnel/step/operator/channel/outcome, and publishes each event through `DomainEventPublisher` (allowing the domain event backbone to forward it to other systems). The dashboard controller surfaces that state for explorers.

## Verification

1. Run the local smoke checker (now includes analytics endpoints) to ensure the stack functions end to end.
2. Postman / curl:
   - `GET http://localhost:8082/api/v1/customer/analytics/taxonomy`
   - `GET http://localhost:8082/api/v1/customer/analytics/dashboard?limit=50`
3. Trigger customer flows (login, plan confirmation, payment checkout, support case creation) and confirm the dashboard grows accordingly.
4. Query Prometheus for `mytelco.product.analytics.events_total` to see counters per funnel step.
