#!/usr/bin/env bash
set -euo pipefail

CUSTOMER_BFF_BASE_URL="${CUSTOMER_BFF_BASE_URL:-http://localhost:8081}"
ADMIN_BFF_BASE_URL="${ADMIN_BFF_BASE_URL:-http://localhost:8082}"
OIDC_ISSUER="${OIDC_ISSUER:-http://localhost:8080/realms/mytelco-white-label}"
OIDC_CLIENT_ID="${OIDC_CLIENT_ID:-web-portal}"
CUSTOMER_USERNAME="${CUSTOMER_USERNAME:-customer1}"
CUSTOMER_PASSWORD="${CUSTOMER_PASSWORD:-customer123}"
ADMIN_USERNAME="${ADMIN_USERNAME:-admin1}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"

ok() { echo "[OK] $1"; }
fail() { echo "[FAIL] $1"; exit 1; }

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    fail "Missing required command: $1"
  fi
}

wait_http_200() {
  local url="$1"
  local timeout_sec="${2:-120}"
  local started_at
  started_at="$(date +%s)"

  while true; do
    local status_code
    status_code="$(curl -sS -o /tmp/contract-check-body.txt -w '%{http_code}' "$url" || true)"

    if [[ "$status_code" == "200" ]]; then
      return 0
    fi

    if (( $(date +%s) - started_at >= timeout_sec )); then
      fail "Timeout waiting for HTTP 200 at $url (last status: $status_code)"
    fi

    sleep 2
  done
}

request_token() {
  local username="$1"
  local password="$2"

  curl -sS -X POST "${OIDC_ISSUER}/protocol/openid-connect/token" \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    --data-urlencode "grant_type=password" \
    --data-urlencode "client_id=${OIDC_CLIENT_ID}" \
    --data-urlencode "username=${username}" \
    --data-urlencode "password=${password}" \
    --data-urlencode "scope=openid roles" \
  | jq -r '.access_token // empty'
}

assert_path_exists() {
  local docs_file="$1"
  local path="$2"

  if ! jq -e --arg p "$path" '.paths[$p] != null' "$docs_file" >/dev/null; then
    fail "OpenAPI contract missing required path: $path"
  fi
}

require_cmd curl
require_cmd jq

wait_http_200 "${CUSTOMER_BFF_BASE_URL}/actuator/health" 180
wait_http_200 "${ADMIN_BFF_BASE_URL}/actuator/health" 180

curl -sS "${CUSTOMER_BFF_BASE_URL}/api-docs" > /tmp/customer-api-docs.json
curl -sS "${ADMIN_BFF_BASE_URL}/api-docs" > /tmp/admin-api-docs.json

assert_path_exists /tmp/customer-api-docs.json "/api/v1/customer/account-overview"
assert_path_exists /tmp/customer-api-docs.json "/api/v1/customer/dashboard"
assert_path_exists /tmp/customer-api-docs.json "/api/v1/customer/catalog/confirm-selection"
assert_path_exists /tmp/customer-api-docs.json "/api/v1/customer/analytics/taxonomy"

assert_path_exists /tmp/admin-api-docs.json "/api/v1/admin/operators"
assert_path_exists /tmp/admin-api-docs.json "/api/v1/admin/operators/{operatorId}/content"
assert_path_exists /tmp/admin-api-docs.json "/api/v1/admin/operators/{operatorId}/offers"

ok "OpenAPI contract paths validated"

CUSTOMER_TOKEN="$(request_token "$CUSTOMER_USERNAME" "$CUSTOMER_PASSWORD")"
ADMIN_TOKEN="$(request_token "$ADMIN_USERNAME" "$ADMIN_PASSWORD")"

[[ -n "$CUSTOMER_TOKEN" ]] || fail "Failed to obtain customer access token"
[[ -n "$ADMIN_TOKEN" ]] || fail "Failed to obtain admin access token"

curl -sS -H "Authorization: Bearer ${CUSTOMER_TOKEN}" \
  "${CUSTOMER_BFF_BASE_URL}/api/v1/customer/account-overview" > /tmp/contract-account-overview.json
jq -e '.plan and .activeLineCount >= 0 and .lineStructure != null' /tmp/contract-account-overview.json >/dev/null \
  || fail "account-overview response does not match expected contract"

curl -sS -H "Authorization: Bearer ${CUSTOMER_TOKEN}" \
  "${CUSTOMER_BFF_BASE_URL}/api/v1/customer/analytics/taxonomy" > /tmp/contract-analytics-taxonomy.json
jq -e 'type == "array" and length > 0 and .[0].eventType and .[0].funnel and .[0].step' /tmp/contract-analytics-taxonomy.json >/dev/null \
  || fail "analytics taxonomy response does not match expected contract"

curl -sS -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  "${ADMIN_BFF_BASE_URL}/api/v1/admin/operators" > /tmp/contract-admin-operators.json
jq -e 'type == "array" and length > 0 and .[0].operatorId and .[0].name' /tmp/contract-admin-operators.json >/dev/null \
  || fail "admin operators response does not match expected contract"

curl -sS -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  "${ADMIN_BFF_BASE_URL}/api/v1/admin/operators/default/content" > /tmp/contract-admin-content.json
jq -e 'type == "array"' /tmp/contract-admin-content.json >/dev/null \
  || fail "admin content response does not match expected contract"

curl -sS -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  "${ADMIN_BFF_BASE_URL}/api/v1/admin/operators/default/offers" > /tmp/contract-admin-offers.json
jq -e 'type == "array"' /tmp/contract-admin-offers.json >/dev/null \
  || fail "admin offers response does not match expected contract"

ok "Runtime API contracts validated"

echo "Contract API check completed"
