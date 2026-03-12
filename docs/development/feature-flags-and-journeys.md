# Feature Flags and Journeys (F-04.3 MVP)

## Overview

This MVP introduces operator-scoped and channel-scoped runtime configuration for:

- feature flags (`web` / `mobile` / `admin`)
- configurable customer journeys (ordered steps + conditions)

Configuration is loaded from `platform-config/operators/<operator-id>/...` and exposed by Admin BFF endpoints.

## Config model

### Feature flags

Path:

- `platform-config/operators/<operator-id>/features/flags.json`

Model:

- `operatorId`: operator identifier
- `version`: monotonically increasing config version
- `updatedAt`: last update timestamp (ISO-8601)
- `channels.web.flags`, `channels.mobile.flags`, `channels.admin.flags`: map of `flagKey -> boolean`

Schema:

- `platform-config/operators/schema/feature-flags.schema.json`

### Journey configuration

Path:

- `platform-config/operators/<operator-id>/journeys/<journey-id>.json`

Model:

- `operatorId`, `journeyId`, `version`
- `steps[]` with ordered `order`, `id`, `type`, `condition`

Schema:

- `platform-config/operators/schema/journey.schema.json`

## Scoping model (operator + channel)

Feature flags are resolved by:

1. operator (`default`, `alpha-telecom`, ...)
2. channel (`web`, `mobile`, `admin`)

Admin BFF endpoint:

- `GET /api/v1/admin/config/flags/{operatorId}/{channel}`

## Runtime update + audit behavior

Admin BFF update endpoint:

- `PATCH /api/v1/admin/config/flags/{operatorId}/{channel}/{flagKey}`

Request body:

```json
{ "enabled": true }
```

Behavior:

- updates in-memory runtime flag state for the scoped operator/channel
- increments config version
- creates audit record with actor, timestamp, old/new values, version

Audit endpoint:

- `GET /api/v1/admin/config/flags/audit/{operatorId}/{channel}`

## Journey semantics

Journey endpoint:

- `GET /api/v1/admin/config/journeys/{operatorId}/{journeyId}`

Each journey is an ordered sequence of configurable steps. `condition` is currently a declarative expression string evaluated by downstream journey orchestration (not executed by Admin BFF in MVP).

## No-redeploy update mechanism and caveats

MVP runtime updates are **in-memory** in Admin BFF:

- effective immediately without redeploy
- not persisted back to repository files
- not replicated across multiple Admin BFF instances

Implications:

- restart resets runtime updates to file-backed defaults
- horizontal scaling requires shared persistence/event propagation in next iteration

Recommended next step:

- migrate audit + mutable flags to durable storage (e.g., Postgres + optimistic locking + change feed) and keep `platform-config` as bootstrap defaults.
