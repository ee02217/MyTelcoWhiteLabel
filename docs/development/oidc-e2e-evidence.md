# OIDC E2E Hardening Evidence (#86)

## Scope

- Web portal: OIDC Auth Code + PKCE login, refresh, logout, protected-route behavior
- Mobile app: OIDC Auth Code + PKCE login (expo-auth-session), refresh, logout, protected-route behavior
- Local wiring: issuer/client/callback configuration for deterministic local runs
- Evidence script: reproducible endpoint + token-path checks

## Implemented changes

1. **Web OIDC implementation**
   - `web-portal/src/auth-oidc.ts`
   - `web-portal/src/App.tsx`
   - Supports:
     - auth code + PKCE login start
     - callback completion + code exchange
     - refresh token grant
     - RP-initiated logout
     - protected API call with bearer token and explicit 401/403 handling

2. **Mobile OIDC implementation**
   - `mobile-app/App.tsx`
   - `mobile-app/package.json` (added `expo-auth-session`, `expo-web-browser`)
   - Supports:
     - auth code + PKCE login via `expo-auth-session`
     - token exchange and secure local persistence
     - refresh token flow
     - logout + local session clear + Keycloak end-session call
     - protected API call with explicit 401/403 handling

3. **Environment/local wiring**
   - `.env.local.example`
   - Added issuer/client/callback/logout settings for web + mobile local flows

4. **Realm/client hardening alignment**
   - `infra/keycloak/realm-export/telco-dev-realm.json`
   - Updated `web-portal` client for public PKCE flow and explicit local redirect/web origins.

5. **Repro script**
   - `scripts/oidc-e2e-check.sh`
   - Checks:
     - OIDC discovery/JWKS reachability
     - protected API 401 without token
     - optional protected API 200 with `ACCESS_TOKEN`
     - optional 403 with `FORBIDDEN_TOKEN`
     - optional refresh token grant with `REFRESH_TOKEN`

## Evidence matrix

| Area     | Scenario                                      | Result                                                       | Evidence                                                |
| -------- | --------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------- |
| Web      | Auth code + PKCE login wiring                 | PASS (implemented)                                           | `web-portal/src/auth-oidc.ts`, `web-portal/src/App.tsx` |
| Web      | Token refresh handling                        | PASS (implemented)                                           | `refreshSession` in `web-portal/src/auth-oidc.ts`       |
| Web      | Logout handling                               | PASS (implemented)                                           | `logout` in `web-portal/src/auth-oidc.ts`               |
| Web      | Protected endpoint 401/403 handling           | PASS (implemented)                                           | `authedFetch` in `web-portal/src/App.tsx`               |
| Mobile   | Auth code + PKCE login wiring                 | PASS (implemented)                                           | `AuthSession.useAuthRequest` in `mobile-app/App.tsx`    |
| Mobile   | Token refresh handling                        | PASS (implemented)                                           | `AuthSession.refreshAsync` in `mobile-app/App.tsx`      |
| Mobile   | Logout handling                               | PASS (implemented)                                           | `signOut` in `mobile-app/App.tsx`                       |
| Mobile   | Protected endpoint 401/403 handling           | PASS (implemented)                                           | `callProtected` in `mobile-app/App.tsx`                 |
| Platform | OIDC endpoint reachability                    | PASS (validated)                                             | `bash scripts/oidc-e2e-check.sh` output                 |
| Platform | Protected endpoint without token -> 401       | PASS (validated)                                             | `bash scripts/oidc-e2e-check.sh` output                 |
| Platform | Protected endpoint with provided token -> 200 | PARTIAL (script support added; token env required)           | `ACCESS_TOKEN=... bash scripts/oidc-e2e-check.sh`       |
| Platform | Role mismatch path -> 403                     | PARTIAL (script support added; forbidden token env required) | `FORBIDDEN_TOKEN=... bash scripts/oidc-e2e-check.sh`    |
| Platform | Refresh token grant                           | PARTIAL (script support added; refresh token env required)   | `REFRESH_TOKEN=... bash scripts/oidc-e2e-check.sh`      |

## Validation commands run

```bash
npm run -s typecheck --prefix web-portal
npm run -s typecheck --prefix mobile-app
bash scripts/oidc-e2e-check.sh
```

## Validation notes

- `scripts/oidc-e2e-check.sh` succeeded for discovery/JWKS and 401 no-token path.
- Optional 200/403/refresh assertions are available and deterministic once caller supplies captured tokens from an authenticated login session.
- `mvn ... AdminBffSecurityTest` failed in this environment due Java 25 + ByteBuddy/Mockito compatibility (pre-existing infra/toolchain issue), not OIDC flow logic.
