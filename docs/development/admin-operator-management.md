# Admin Operator Management (F-10.1)

## Objective

Provide backend metadata APIs so admin users can manage operator configuration scope with versioning and audit visibility.

This phase focuses on **backend metadata first**.

## Endpoints

Base path: `/api/v1/admin/operators`

### List operators

- `GET /api/v1/admin/operators`

Returns per-operator summary including:

- operator id and display name
- current config version
- updated timestamp
- locales
- channel count
- journey count
- managed user count

### Operator profile

- `GET /api/v1/admin/operators/{operatorId}/profile`

Returns:

- branding metadata (logos, favicon, primary/secondary colors)
- feature flags grouped by channel
- locales
- journey count
- version and updatedAt

- `PATCH /api/v1/admin/operators/{operatorId}/profile`

Supports update of:

- `name`
- `locales[]`
- `featuresByChannel`

Each successful change increments profile `version` and writes audit entry.

### Operator users and roles

- `GET /api/v1/admin/operators/{operatorId}/users`
- `PATCH /api/v1/admin/operators/{operatorId}/users/{userId}/roles`

Role updates are scoped per operator and support:

- role set update
- enabled/disabled state update

Each successful change increments operator version and writes audit entry.

### Audit

- `GET /api/v1/admin/operators/{operatorId}/audit?limit=50`

Returns recent versioned audit entries for profile and user-role changes.

## Data sources

Loaded from:

- `platform-config/operators/{operator}/branding/config.json`
- `platform-config/operators/{operator}/features/flags.json`
- `platform-config/operators/{operator}/journeys/*.json`

## Versioning model

Version is tracked per operator metadata state.

Version increments on:

- profile updates
- user role updates

No-op updates do not increment version.

## Local defaults

`bff/admin-bff/src/main/resources/application.yml`:

```yaml
admin:
  config:
    operators-path: ${ADMIN_CONFIG_OPERATORS_PATH:platform-config/operators}
    default-locales: ${ADMIN_CONFIG_DEFAULT_LOCALES:en-GB,pt-PT}
```

## Notes

- Security remains under existing admin-bff policy (`/api/v1/admin/**` protected for ADMIN/SUPPORT roles).
- This phase intentionally defers admin-portal UI enhancements to the next pass.

## Offer lifecycle (F-10.3)

### API contract

The admin BFF now exposes offer lifecycle APIs under `/api/v1/admin/operators/{operatorId}/offers`:

- `GET /offers` – lists catalogs with version, state, visible channels, eligibility metadata, and audit information.
- `GET /offers/{offerId}` – returns the latest offer plus full version history (draft → approval → published → retired).
- `PATCH /offers/{offerId}` – appends a new version, enforces valid state transitions, preserves audits via `OperatorManagementService.recordExternalAudit()`, and optionally creates a new offer when the ID does not exist yet.

The backend loads offer metadata from `platform-config/operators/{operatorId}/offers/*.json` and validates the files against `platform-config/operators/schema/offer.schema.json`.

### UI

The admin portal features a dedicated "Offers" panel alongside Profile/CMS controls:

- Operators can select or create offer IDs, edit descriptive metadata, visibility rules, and eligibility JSON, and advance the state through draft → approval → publish → retire.
- Each save call increments the version, records the actor/notes/reviewer, and refreshes the history list.
- History entries and audit breadcrumbs are displayed in the panel to help marketing/product stakeholders track lifecycle transitions.
