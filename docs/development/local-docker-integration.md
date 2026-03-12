# Local Docker integration environment

This guide starts the local integrated stack for end-to-end component integration and look/feel validation.

## Scope (MVP)

The local compose stack includes:

- postgres
- keycloak
- kong
- customer-bff
- admin-bff
- web-portal
- admin-portal

Compose file:

- `infra/docker/docker-compose.local.yml`

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
   docker compose --env-file .env.local.example -f infra/docker/docker-compose.local.yml config
   ```

3. Boot local integration stack:

   ```bash
   docker compose --env-file .env.local.example -f infra/docker/docker-compose.local.yml up -d --build
   ```

4. Check service status:

   ```bash
   docker compose --env-file .env.local.example -f infra/docker/docker-compose.local.yml ps -a
   ```

5. Tail logs for a service:

   ```bash
   docker compose --env-file .env.local.example -f infra/docker/docker-compose.local.yml logs -f customer-bff
   ```

## Health checks

Run smoke checks:

```bash
bash scripts/local-smoke-check.sh
```

Manual health probes:

- Postgres readiness: `docker exec mytelco-postgres pg_isready -U mytelco -d mytelco`
- Keycloak readiness: `http://localhost:8080/health/ready`
- Keycloak login reachability: `http://localhost:8080/realms/master/account`
- Kong admin reachability (TLS): `https://localhost:8444/`
- Kong proxy reachability: `http://localhost:8000/`
- Customer BFF actuator: `http://localhost:8081/actuator/health`
- Admin BFF actuator: `http://localhost:8082/actuator/health`
- Web portal: `http://localhost:3000`
- Admin portal: `http://localhost:3001`

## Execution evidence (2026-03-12)

Commands executed:

```bash
docker compose --env-file .env.local.example -f infra/docker/docker-compose.local.yml config
docker compose --env-file .env.local.example -f infra/docker/docker-compose.local.yml up -d --build
docker compose --env-file .env.local.example -f infra/docker/docker-compose.local.yml ps -a
bash -n scripts/local-smoke-check.sh
bash scripts/local-smoke-check.sh
```

Observed smoke results:

- ✅ postgres readiness
- ✅ keycloak health + login reachability
- ✅ kong admin reachability (via `8444` TLS) + proxy reachability
- ✅ customer-bff health endpoint
- ✅ admin-bff health endpoint
- ✅ web/admin portal HTTP reachability

## Seeded demo data path

Current seeded identity/demo data source:

- Keycloak realm import JSON: `infra/keycloak/realm-export/telco-dev-realm.json`

Postgres demo data seeding is not yet automated in this slice. Add SQL/bootstrap scripts in follow-up increments and document the path in this section.

## Known gaps and next steps

1. **Frontend runtime gap (architectural debt):** the compose baseline serves static placeholder pages for `web-portal` and `admin-portal` via `nginx:alpine` (mounted `infra/docker/static/.../index.html`) to provide deterministic HTTP reachability while front-end container builds are currently blocked by missing design token artifacts.
   - Debt cost: no real SPA runtime behavior is validated in this baseline.
   - Payback trigger: before any end-to-end UX sign-off or release-candidate validation.

2. **BFF packaging dependency:** BFF images now rely on Spring Boot repackaged executable jars (`spring-boot:repackage`) and mounted `platform-config` directory for admin startup.
   - Debt cost: runtime depends on compose-level volume convention.
   - Payback trigger: when hardening container immutability for CI/staging parity.

3. **Kong admin reachability:** admin API is validated through TLS admin listener (`8444`) with explicit `KONG_ADMIN_LISTEN`.
   - Debt cost: local scripts must probe TLS admin endpoint (not plain `8001`).
   - Payback trigger: when finalizing gateway security profile across environments.

## Troubleshooting

- **Port conflicts**: change values in `.env.local`.
- **Image build failures**: run `docker compose ... build --no-cache` and inspect logs.
- **BFF healthcheck failing**: inspect actuator endpoint and startup logs:

  ```bash
  docker compose --env-file .env.local.example -f infra/docker/docker-compose.local.yml logs customer-bff admin-bff
  ```

- **Reset local state**:

  ```bash
  docker compose --env-file .env.local.example -f infra/docker/docker-compose.local.yml down -v
  ```
