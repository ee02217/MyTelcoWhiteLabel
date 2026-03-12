#!/usr/bin/env bash
set -euo pipefail

ISSUER="${OIDC_ISSUER:-http://localhost:8080/realms/mytelco-white-label}"
CLIENT_ID="${OIDC_CLIENT_ID:-mobile-app}"
BFF_BASE="${CUSTOMER_BFF_BASE_URL:-http://localhost:8081}"
ACCESS_TOKEN="${ACCESS_TOKEN:-}"
REFRESH_TOKEN="${REFRESH_TOKEN:-}"
FORBIDDEN_TOKEN="${FORBIDDEN_TOKEN:-}"

ok(){ echo "[OK] $1"; }
warn(){ echo "[WARN] $1"; }
fail(){ echo "[FAIL] $1"; exit 1; }

code(){
  curl -sS -o /tmp/oidc-e2e-body.txt -w "%{http_code}" "$@"
}

echo "== OIDC endpoint reachability =="
[[ "$(code "${ISSUER}/.well-known/openid-configuration")" == "200" ]] || fail "well-known endpoint unavailable"
ok "OIDC discovery reachable"

[[ "$(code "${ISSUER}/protocol/openid-connect/certs")" == "200" ]] || fail "JWKS endpoint unavailable"
ok "OIDC JWKS reachable"

echo "== Protected API negative path =="
[[ "$(code "${BFF_BASE}/api/v1/customer/account-overview")" == "401" ]] || fail "expected 401 without token"
ok "401 confirmed when no bearer token"

if [[ -n "$ACCESS_TOKEN" ]]; then
  auth_code=$(code -H "Authorization: Bearer ${ACCESS_TOKEN}" "${BFF_BASE}/api/v1/customer/account-overview")
  if [[ "$auth_code" == "200" ]]; then
    ok "200 confirmed with ACCESS_TOKEN"
  else
    fail "expected 200 with ACCESS_TOKEN, got ${auth_code}"
  fi
else
  warn "ACCESS_TOKEN not provided; skipping protected success assertion"
fi

if [[ -n "$FORBIDDEN_TOKEN" ]]; then
  forbidden_code=$(code -H "Authorization: Bearer ${FORBIDDEN_TOKEN}" "${BFF_BASE}/api/v1/customer/account-overview")
  if [[ "$forbidden_code" == "403" ]]; then
    ok "403 confirmed with FORBIDDEN_TOKEN"
  else
    fail "expected 403 with FORBIDDEN_TOKEN, got ${forbidden_code}"
  fi
else
  warn "FORBIDDEN_TOKEN not provided; skipping 403 assertion"
fi

if [[ -n "$REFRESH_TOKEN" ]]; then
  echo "== Refresh token grant =="
  refresh_response=$(curl -sS -X POST "${ISSUER}/protocol/openid-connect/token" \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    --data-urlencode "grant_type=refresh_token" \
    --data-urlencode "client_id=${CLIENT_ID}" \
    --data-urlencode "refresh_token=${REFRESH_TOKEN}")

  echo "$refresh_response" | grep -q '"access_token"' || fail "refresh response missing access_token"
  ok "refresh token grant returned access_token"
else
  warn "REFRESH_TOKEN not provided; skipping refresh grant assertion"
fi

echo "OIDC E2E check completed"
