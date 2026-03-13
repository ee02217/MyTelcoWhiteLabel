# Notification Center (F-08.3)

## Scope

MVP notification center for customer channels with:

- Central inbox for push, SMS, email, and in-app notifications.
- Category-level preference management per channel.
- Per-channel delivery status lifecycle tracking.

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

MVP helper that creates one logical notification and fans out channel delivery entries.

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

For each selected channel, the service records transition entries:

1. `QUEUED`
2. `SENT`
3. terminal: `DELIVERED` or `FAILED`

The inbox carries the full per-channel lifecycle trace for each logical notification.

## MVP Limitations

- In-memory store only (non-durable, single instance scope).
- No external provider callbacks/webhooks yet.
- No retry orchestration or DLQ handling.
- No explicit read/unread mutation endpoint yet (`readAt` remains nullable in current scope).

## Future Integration Notes

- Replace in-memory persistence with DB-backed notification + delivery tables.
- Add provider adapters (FCM/APNs/SMS gateway/email provider) with callback ingestion.
- Move status transitions to event-driven flow from provider acknowledgements.
- Add read-state endpoint and pagination/filtering.
