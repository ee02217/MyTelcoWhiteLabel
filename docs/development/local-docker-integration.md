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
- optional Kafka broker (profile `kafka`, for integration day)

Compose file:

- `infra/docker/docker-compose.local.yml`

Kong profile used by local compose:

- `infra/kong/kong.local.yml`

## Prerequisites

- Docker Engine + Docker Compose plugin
- Available local ports: `5432`, `8080`, `8000`, `8001`, `8443`, `8444`, `8081`, `8082`, `3000`, `3001`
- Optional Kafka mode port: `9092`

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

## Integration day: enable real Kafka dispatch

By default, event backbone runs in `stub` mode (no real broker publish). For integration validation day, enable Kafka in the same compose stack.

1. Enable Kafka dispatch in `.env.local`:

   ```bash
   MYTELCO_EVENTS_DISPATCH_MODE=kafka
   SPRING_KAFKA_BOOTSTRAP_SERVERS=kafka:9092
   ```

2. Start stack with Kafka profile:

   ```bash
   docker compose --env-file .env.local -f infra/docker/docker-compose.local.yml --profile kafka up -d --build
   ```

3. Verify dispatcher mode:

   ```bash
   # (with bearer token)
   curl -s -H "Authorization: Bearer <TOKEN>" \
     http://localhost:8081/api/v1/customer/events/dispatch-status
   ```

4. Return to default lightweight mode after integration day:

   ```bash
   # set MYTELCO_EVENTS_DISPATCH_MODE=stub in .env.local
   docker compose --env-file .env.local -f infra/docker/docker-compose.local.yml up -d --build
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

## Docker validation evidence pack

For docker-only environments, run the hardening evidence scripts below after the stack is healthy.

1. Rollback-equivalent validation (simulated bad rollout + restore baseline image):

   ```bash
   bash scripts/docker-rollback-evidence.sh
   ```

2. Authenticated BFF latency validation (p50/p95/p99, 1000 requests @ concurrency 20):

   ```bash
   bash scripts/docker-bff-performance-evidence.sh
   ```

3. Dashboard load validation under constrained network profile (default: 30 runs, 10 Mbps cap, synthetic RTT 150ms):

   ```bash
   bash scripts/docker-dashboard-load-evidence.sh
   ```

Artifacts are written under `evidence/YYYY-MM-DD/` with timestamped filenames (raw logs + summary markdown + csv).

## Observability stack (F-11.1)

The local stack now includes Prometheus, Grafana, Jaeger/OTel, OpenSearch, and Fluent Bit for metrics, traces, and centralized logs.

- **Prometheus** (`http://localhost:${PROMETHEUS_PORT:-9090}`) scrapes all services via `infra/observability/prometheus/prometheus.yml`.
- **Grafana** (`http://localhost:${GRAFANA_PORT:-3005}`) is provisioned with dashboards in `infra/observability/grafana/dashboards/`.
- **OpenSearch + Fluent Bit** collect container logs. Results land under index `mytelco-logs-*` on `http://localhost:${OPENSEARCH_PORT:-9200}`.
- **Jaeger + OpenTelemetry Collector** (`http://localhost:${JAEGER_UI_PORT:-16686}`) surfaces request traces, and the collector exports traces to Jaeger via `infra/observability/otel-collector/config.yml`.

You can confirm observability health with the smoke checker or manually: `curl http://localhost:${PROMETHEUS_PORT:-9090}/-/ready`, `curl http://localhost:${GRAFANA_PORT:-3005}/api/health`, `curl http://localhost:${OPENSEARCH_PORT:-9200}/_cluster/health?wait_for_status=yellow`, `curl http://localhost:${JAEGER_UI_PORT:-16686}/api/services`, and `curl http://localhost:4318/health` for the collector.

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
