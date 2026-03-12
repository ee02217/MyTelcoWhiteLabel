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

2. Boot local integration stack:

   ```bash
   docker compose --env-file .env.local -f infra/docker/docker-compose.local.yml up -d --build
   ```

3. Check service status:

   ```bash
   docker compose --env-file .env.local -f infra/docker/docker-compose.local.yml ps
   ```

4. Tail logs for a service:

   ```bash
   docker compose --env-file .env.local -f infra/docker/docker-compose.local.yml logs -f customer-bff
   ```

## Health checks

Run smoke checks:

```bash
./scripts/local-smoke-check.sh
```

Manual health probes:

- Keycloak readiness: `http://localhost:8080/health/ready`
- Kong status: `http://localhost:8001/status`
- Customer BFF actuator: `http://localhost:8081/actuator/health`
- Admin BFF actuator: `http://localhost:8082/actuator/health`
- Web portal: `http://localhost:3000`
- Admin portal: `http://localhost:3001`

## Seeded demo data path

Current seeded identity/demo data source:

- Keycloak realm import JSON: `infra/keycloak/realm-export/telco-dev-realm.json`

Postgres demo data seeding is not yet automated in this first slice. Add SQL/bootstrap scripts in a follow-up increment and document the path in this section.

## Smoke flow

1. Start stack with compose.
2. Confirm all containers are `running` and healthchecks are green.
3. Open customer web portal (`http://localhost:3000`).
4. Open admin portal (`http://localhost:3001`).
5. Validate Keycloak login page is reachable (`http://localhost:8080`).
6. Verify Kong admin endpoint responds (`http://localhost:8001/status`).

## Troubleshooting

- **Port conflicts**: change values in `.env.local`.
- **Image build failures**: run `docker compose ... build --no-cache` and inspect logs.
- **BFF healthcheck failing**: inspect actuator endpoint and startup logs:

  ```bash
  docker compose --env-file .env.local -f infra/docker/docker-compose.local.yml logs customer-bff admin-bff
  ```

- **Reset local state**:

  ```bash
  docker compose --env-file .env.local -f infra/docker/docker-compose.local.yml down -v
  ```
