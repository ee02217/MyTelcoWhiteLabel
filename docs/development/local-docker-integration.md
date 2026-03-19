# Local Docker integration environment

This guide brings up the local integrated stack with **real SPA builds** for web/admin portals (not static placeholders), deterministic baseline seeding, and smoke validation.

## Scope (MVP)

The local compose stack includes:

- postgres (with deterministic baseline SQL init)
- keycloak (deterministic realm import)
- kong
- customer-bff
- admin-bff
- web-portal (built from `web-portal/` and served by nginx)
- admin-portal (built from `admin-portal/` and served by nginx)

Compose file:

- `infra/docker/docker-compose.local.yml`

Kong profile used by local compose:

- `infra/kong/kong.local.yml`

## Prerequisites

- Docker Engine + Docker Compose plugin
- Available local ports: `5432`, `8080`, `8000`, `8001`, `8443`, `8444`, `8081`, `8082`, `3000`, `3001`

## Startup

1. Create local env file:

   ```bash
   cp .env.local.example .env.local
   ```

2. Validate compose configuration:

   ```bash
   docker compose --env-file .env.local -f infra/docker/docker-compose.local.yml config
   ```

3. Boot local integration stack:

   ```bash
   docker compose --env-file .env.local -f infra/docker/docker-compose.local.yml up -d --build
   ```

4. Check service status:

   ```bash
   docker compose --env-file .env.local -f infra/docker/docker-compose.local.yml ps -a
   ```

5. Run smoke checks:

   ```bash
   bash scripts/local-smoke-check.sh
   ```

## Frontend API wiring strategy

Runtime API routing uses nginx reverse-proxy for both SPA containers:

- Requests to `/api/*` from browser go to the portal container.
- nginx proxies `/api/*` to `${API_UPSTREAM}` (default `http://kong:8000`).
- This is set via compose env vars:
  - `WEB_PORTAL_API_UPSTREAM`
  - `ADMIN_PORTAL_API_UPSTREAM`

Files:

- `infra/docker/nginx/web-portal.conf.template`
- `infra/docker/nginx/admin-portal.conf.template`

This keeps browser-side API base deterministic in local docker without rebuilding app code per endpoint change.

## Deterministic seed baseline

### Postgres

- Init SQL: `infra/docker/postgres/init/001-baseline.sql`
- Mounted into: `/docker-entrypoint-initdb.d/001-baseline.sql`
- Seed marker table:
  - `bootstrap.seed_info`
  - expected row: `id=1, seed_version=local-baseline-v1`

> Note: postgres init scripts run on first DB initialization. To re-run deterministically, reset volume with `docker compose ... down -v`.

### Keycloak

- Realm import file: `infra/keycloak/realm-export/telco-dev-realm.json`
- Keycloak starts with `--import-realm`

## Smoke checks covered

`scripts/local-smoke-check.sh` validates:

- postgres readiness
- postgres baseline seed presence
- keycloak readiness/login reachability
- kong admin/proxy reachability
- customer-bff/admin-bff health endpoints
- web/admin portal root serves real SPA HTML titles
- web portal `/api` proxy path reachability (`/api/v1/customer/account-overview`)

## Troubleshooting

- **Port conflicts**: change values in `.env.local`.
- **Image build failures**: run `docker compose ... build --no-cache` and inspect logs.
- **Seed not present**:
  - ensure fresh postgres volume (`down -v`) for first-init scripts.
  - confirm script mount path in compose.
- **API proxy failures from portals**:
  - verify `WEB_PORTAL_API_UPSTREAM` / `ADMIN_PORTAL_API_UPSTREAM`
  - ensure `kong` is healthy and routing config is loaded.

Reset local state:

```bash
docker compose --env-file .env.local -f infra/docker/docker-compose.local.yml down -v
```
