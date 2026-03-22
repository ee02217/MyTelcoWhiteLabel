# Kafka Event Backbone (F-09.3)

## Objective

Provide a standardized event architecture in customer-bff with:

- deterministic topic naming,
- schema version policy,
- dead-letter handling,
- replay tooling,
- retry policy for dispatch.

This implementation uses a stub dispatcher for local/docker runtime while preserving production-facing contracts.

## Topic contracts

Defined in `EventTopic`:

- `mytelco.usage.events.v1`
- `mytelco.billing.events.v1`
- `mytelco.payment.events.v1`
- `mytelco.orders.events.v1`
- `mytelco.notifications.events.v1`

## Envelope

`DomainEventEnvelope` fields:

- `eventId`
- `topic`
- `eventType`
- `schemaVersion`
- `customerId`
- `correlationId`
- `occurredAt`
- `payload`
- `metadata`

## Schema versioning policy

Managed by `EventSchemaVersionPolicy`:

- baseline per-event mapping in code
- override map via config: `mytelco.events.schema.versions`
- fallback default: `mytelco.events.schema.default-version`

Inspect effective policy:

- `GET /api/v1/customer/events/schema-policy`

## Dead-letter + replay

Failed dispatches are persisted as `DeadLetterEvent` with:

- attempts
- replayCount
- errorCode/errorMessage
- failedAt/lastAttemptAt

APIs:

- `GET /api/v1/customer/events/dlq?topic=<topic>&limit=<n>`
- `POST /api/v1/customer/events/dlq/{eventId}/replay`
- `POST /api/v1/customer/events/dlq/replay?topic=<topic>&limit=<n>`

Outbox inspection:

- `GET /api/v1/customer/events/outbox?topic=<topic>&limit=<n>`
- `GET /api/v1/customer/events/topics`
- `GET /api/v1/customer/events/dispatch-status`

## Retry policy

Dispatch retry is centralized in `DomainEventBackboneService`:

- max attempts: `mytelco.events.retry.max-attempts`
- initial backoff: `mytelco.events.retry.initial-backoff`
- multiplier: `mytelco.events.retry.multiplier`
- max backoff: `mytelco.events.retry.max-backoff`

## Fault injection (local)

To force DLQ for validation:

- `mytelco.events.dispatch.fail-on-topics`
- `mytelco.events.dispatch.fail-on-event-types`

The stub dispatcher throws when configured match occurs, enabling deterministic replay tests.

## Event publishers wired in this phase

- Usage:
  - `usage.details.requested.v1`
  - `usage.threshold.crossed.v1`
- Billing:
  - `billing.explorer.viewed.v1`
- Payment:
  - `payment.method.registered.v1`
  - `payment.checkout.processed.v1`
  - `payment.checkout.replayed.v1`
  - `payment.retry.processed.v1`
  - `payment.retry.replayed.v1`
- Orders:
  - `order.state.changed.v1`
- Notifications:
  - `notification.preferences.updated.v1`
  - `notification.test.sent.v1`

## Dispatcher modes

Dispatcher selection is configuration-driven:

- `mytelco.events.dispatch.mode=stub` (default)
  - uses `StubKafkaEventDispatcher`
  - logs dispatches and supports fault-injection for DLQ testing
- `mytelco.events.dispatch.mode=kafka`
  - uses `KafkaDomainEventDispatcher`
  - publishes serialized `DomainEventEnvelope` JSON payloads to configured Kafka topic names

Kafka mode uses:

- `spring.kafka.bootstrap-servers`
- `mytelco.events.dispatch.send-timeout`

Example (docker/local):

```env
MYTELCO_EVENTS_DISPATCH_MODE=kafka
SPRING_KAFKA_BOOTSTRAP_SERVERS=localhost:9092
SPRING_KAFKA_PRODUCER_MAX_BLOCK_MS=3000
SPRING_KAFKA_PRODUCER_REQUEST_TIMEOUT_MS=2000
SPRING_KAFKA_PRODUCER_DELIVERY_TIMEOUT_MS=5000
```

For docker integration day, run compose with Kafka profile:

```bash
docker compose --env-file .env.local -f infra/docker/docker-compose.local.yml --profile kafka up -d --build
```

## Notes

- Stub mode remains the safe default for local runtime.
- Kafka mode preserves the same envelope/topic/schema contracts while switching transport to real broker dispatch.
- Existing outbox/DLQ/replay APIs remain unchanged across dispatcher modes.
