# Kong Gateway Profiles (Local vs Production)

## Overview

MyTelcoWhiteLabel now ships two declarative Kong profiles:

- `infra/kong/kong.local.yml` → local development profile (Docker compose)
- `infra/kong/kong.yml` → production-hardened profile (environment-rendered)

This split keeps local ergonomics while preventing production from inheriting dev-safe defaults.

## Security strategy for JWT/OIDC at the edge

Production profile (`infra/kong/kong.yml`) uses `openid-connect` plugin configuration with explicit:

- `issuer` → `${KONG_OIDC_ISSUER}`
- `jwks_uri` → `${KONG_OIDC_JWKS_URI}`
- `audience_required` → `${KONG_OIDC_AUDIENCE}`

This gives perimeter validation for issuer/signature/audience before traffic reaches BFF services.

> Defense in depth: BFF resource servers still validate JWTs independently.

## CORS policy split

- Local profile can remain permissive for faster integration tests.
- Production profile requires explicit allowlists (`KONG_CUSTOMER_WEB_ORIGIN`, `KONG_ADMIN_WEB_ORIGIN`, `KONG_MOBILE_WEBVIEW_ORIGIN`) and disallows wildcards.

## Upstream target split

- Local profile points to local compose service names (`bff:8080`, `admin-bff:8080`).
- Production profile requires environment-specific upstream hostnames (`KONG_CUSTOMER_BFF_UPSTREAM`, `KONG_ADMIN_BFF_UPSTREAM`).

## Production rendering workflow

1. Copy and fill env template:

   ```bash
   cp infra/kong/.env.production.example .env.kong.production
   # fill real values in secure env management (do not commit secrets)
   ```

2. Export variables and render final file:

   ```bash
   set -a
   source .env.kong.production
   set +a

   bash scripts/render-kong-production-config.sh infra/kong/kong.rendered.yml
   ```

3. Validate and deploy:

   ```bash
   deck file validate infra/kong/kong.rendered.yml
   # then deploy with your gateway workflow (deck sync / config bundle)
   ```

## CI guardrails

`bash scripts/validate-kong-config.sh` enforces:

- no `TODO` placeholders in production profile,
- no wildcard CORS origins in production profile,
- required production markers for upstream + OIDC variables,
- `deck file validate` on local and production profiles.

## Migration steps from local to production

1. Keep local compose unchanged (it uses `kong.local.yml`).
2. Provision production DNS/service names and OIDC endpoints.
3. Render `kong.yml` with production variables.
4. Validate with decK and run deployment.
5. Confirm CORS origin checks, OIDC issuer/JWKS config, and route health in staging before production cutover.
