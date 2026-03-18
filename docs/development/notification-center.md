# Notification Center (F-08.3)

## Scope

MVP notification center for customer channels with:

- Central inbox for push, SMS, email, and in-app notifications.
- Category-level preference management per channel.
- Per-channel delivery status lifecycle tracking.
- Retry-aware delivery execution with terminal failure state.

## API Contracts (customer-bff)

Base path: `/api/v1/customer/notifications`

### `GET /inbox`

Returns inbox entries ordered by `createdAt` desc.

Response item shape:

- `notificationId`
- `customerId`
- `title`
- `message`
- `category` (`BILLING|ORDERS|SECURITY|MARKETING|SERVICE`)
- `deliveries[]`
  - `channel` (`PUSH|SMS|EMAIL|IN_APP`)
  - `status` (`QUEUED|SENT|DELIVERED|FAILED`)
  - `updatedAt`
  - `attempt`
  - `provider`
  - `providerReference` (nullable)
  - `errorCode` (nullable)
  - `errorMessage` (nullable)
- `createdAt`
- `readAt` (nullable)

### `GET /preferences`

Returns customer category/channel preference matrix.

### `PUT /preferences`

Updates category-level channel flags.

Request shape:

```json
{
  "categories": [
    {
      "category": "BILLING",
      "channels": {
        "PUSH": true,
        "SMS": false,
        "EMAIL": true,
        "IN_APP": true
      }
    }
  ]
}
```

### `POST /test-send`

Non-production helper endpoint to generate a logical notification and execute delivery fan-out.

Security and runtime guardrails:

- Requires privileged role (`ADMIN`).
- Can be disabled at runtime via `mytelco.notifications.test-send-enabled=false`.

Request shape:

```json
{
  "title": "Invoice due",
  "message": "Your invoice is due tomorrow",
  "category": "BILLING",
  "requestedChannels": ["SMS", "EMAIL"],
  "forceFailedChannels": ["SMS"]
}
```

## Preference Model

Preferences are stored per customer as:

- `NotificationCategory` -> (`NotificationChannel` -> `enabled:boolean`)

Default policy in MVP: all channels enabled for all categories until user override.

## Delivery Status Lifecycle

For each selected channel, the service records:

1. `QUEUED`
2. One or more `SENT` + terminal statuses per attempt
3. terminal: `DELIVERED` or `FAILED`

Retries are controlled by `mytelco.notifications.delivery.max-attempts`.
Final terminal `FAILED` indicates retry exhaustion.

## Delivery Provider Adapters

Current adapters:

- `stub` (default): deterministic local adapter for development/testing.
- `webhook`: POST-based external adapter (`mytelco.notifications.delivery.webhook-url`).

Each delivery attempt captures provider metadata in inbox history for debugging/support.

## Runtime Configuration

Environment overrides (examples):

- `MYTELCO_NOTIFICATIONS_TEST_SEND_ENABLED=true|false`
- `MYTELCO_NOTIFICATIONS_DELIVERY_PROVIDER=stub|webhook`
- `MYTELCO_NOTIFICATIONS_DELIVERY_MAX_ATTEMPTS=3`
- `MYTELCO_NOTIFICATIONS_DELIVERY_RETRY_BACKOFF=PT1S`
- `MYTELCO_NOTIFICATIONS_DELIVERY_WEBHOOK_URL=https://...`

## Operational Procedures

### 1) Provider credentials / endpoint setup

- For `webhook` provider, ensure `MYTELCO_NOTIFICATIONS_DELIVERY_WEBHOOK_URL` is present.
- Validate egress path and TLS trust from customer-bff runtime.

### 2) Non-production testing

- Keep `MYTELCO_NOTIFICATIONS_TEST_SEND_ENABLED=true` only in non-production.
- Use privileged role calls to `POST /test-send` for smoke validation.

### 3) Production hardening defaults

- Set `MYTELCO_NOTIFICATIONS_TEST_SEND_ENABLED=false`.
- Use `webhook` provider (or future provider adapter) with monitored retries.
- Observe terminal failures in logs/inbox metadata and investigate by `providerReference`.

### 4) Rollback toggles

- Set provider back to `stub` for emergency fallback in lower environments.
- In production, prefer endpoint-level maintenance/feature flags over re-enabling test-send.

## Remaining MVP Limitations

- In-memory store only (non-durable, single instance scope).
- No asynchronous provider callback ingestion yet.
- No explicit read/unread mutation endpoint yet (`readAt` remains nullable in current scope).
- No DLQ or event bus orchestration yet (retries are synchronous in-process).
