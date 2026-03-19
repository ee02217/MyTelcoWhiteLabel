# Customer BFF Durable Runtime State

## Why this exists

Customer-BFF MVP originally stored operational state in in-memory maps. That made behavior non-restart-safe and broke idempotency guarantees on process restart.

This hardening adds durable file-backed state for critical workflows.

## Persisted domains

State is now persisted for:

- **Order orchestration** (`CustomerOrderService`)
  - orders by id
  - idempotency key index
  - line-to-order index
- **Alert inbox + threshold configuration**
  - `AlertInboxService`
  - `ThresholdConfigService`
- **Notification center** (`NotificationCenterService`)
  - channel/category preferences
  - inbox entries and per-channel delivery timeline
- **Support cases** (`SupportCaseService`)
  - case payload and timeline updates

## Storage implementation

A shared `DurableStateStore` abstraction is used by services.

Current implementation:

- `JsonFileDurableStateStore`
- atomic write strategy (`*.tmp` + move)
- configurable storage root via `MYTELCO_STATE_STORAGE_DIR`

Default path:

- `data/customer-bff`

Each persisted payload includes `schemaVersion` to support future migrations.

## Configuration

`bff/customer-bff/src/main/resources/application.yml`:

```yaml
mytelco:
  state:
    storage-dir: ${MYTELCO_STATE_STORAGE_DIR:data/customer-bff}
```

## Restart resilience validation

`DurableStatePersistenceTest` verifies:

1. Order idempotency survives service restart.
2. Notification inbox/preferences survive service restart.
3. Support cases + timeline survive service restart.

Run:

```bash
mvn test -f bff/customer-bff/pom.xml
```

## Known limitations

- Storage is durable per runtime filesystem, not yet centralized cross-instance database.
- For multi-replica production clusters, this should evolve to shared persistent storage (DB/event-backed) with explicit migration scripts.
