# Keycloak Identity (F-03.3)

This document defines the local and baseline production model for OIDC authentication and role-based authorization in MyTelco White-Label.

## Scope

- Identity Provider: Keycloak (OIDC)
- Personas / realm roles: `CUSTOMER`, `ADMIN`, `SUPPORT`
- Clients:
  - `web-portal`
  - `admin-portal`
  - `mobile-app`
  - `customer-bff` (bearer-only API)
  - `admin-bff` (bearer-only API)

## Login Flow

### Web/Admin (Authorization Code Flow)

1. Browser redirects user to Keycloak authorize endpoint.
2. User authenticates in Keycloak.
3. Keycloak redirects back to portal callback URI with authorization code.
4. Portal exchanges code for tokens (access + refresh).
5. Portal calls BFF with bearer access token.
6. BFF validates JWT signature and issuer via configured JWKS/issuer.

### Mobile (Authorization Code + PKCE)

1. Mobile app opens system browser for authorize request with PKCE challenge.
2. Keycloak returns code to custom scheme callback (`mytelco://oauth/callback`).
3. Mobile exchanges code + verifier for tokens.
4. Mobile calls `customer-bff` with access token.

## Role Mapping

- Keycloak emits realm roles in claim `realm_access.roles`.
- `customer-bff` grants `/api/v1/customer/**` only to `ROLE_CUSTOMER`.
- `admin-bff` grants `/api/v1/admin/**` to `ROLE_ADMIN` or `ROLE_SUPPORT`.
- Health and observability endpoints (`/actuator/health/**`, `/actuator/info`, `/actuator/metrics/**`, `/actuator/prometheus`) are unauthenticated.

## Token Expiry and Refresh Strategy

- Access token lifespan is short (default dev: 5 minutes).
- Refresh token is used by portals/mobile to silently renew access tokens.
- BFFs are stateless resource servers and do **not** store refresh tokens.
- Client-side strategy:
  - Refresh proactively (e.g., when token has <60s remaining).
  - On refresh failure (`invalid_grant`), clear session and force new login.
- Backend strategy:
  - Return `401` for invalid/expired tokens.
  - Return `403` for valid token lacking required role.

## Local Development Setup

### 1. Start Keycloak

```bash
cd infra/docker/keycloak
docker compose up -d
```

Keycloak admin: <http://localhost:8080/admin>

- Username: `admin`
- Password: `admin`

Realm import source: `infra/keycloak/realm-export/telco-dev-realm.json`

### 2. Configure BFF env vars

```bash
export SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI=http://localhost:8080/realms/mytelco-white-label
export SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_JWK_SET_URI=http://localhost:8080/realms/mytelco-white-label/protocol/openid-connect/certs
```

### 3. Configure client apps

Copy `.env.example` in each app and adapt values as needed:

- `web-portal/.env.example`
- `admin-portal/.env.example`
- `mobile-app/.env.example`

### 4. Dev sample users

- `customer1 / customer123` → `CUSTOMER`
- `admin1 / admin123` → `ADMIN`
- `support1 / support123` → `SUPPORT`

## Production Hardening Checklist

1. Enforce TLS everywhere (`sslRequired=all`, HTTPS redirect URIs only).
2. Rotate and protect client secrets in a secret manager.
3. Restrict redirect URIs and web origins to exact production domains.
4. Enable brute-force protection and account lockout policies.
5. Set stronger token/session policies and explicit refresh token rotation.
6. Enable centralized audit logging and SIEM integration.
7. Use dedicated realms per environment and least-privilege service accounts.
8. Validate clock sync (NTP) across all nodes to avoid token skew issues.
