#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="infra/docker/docker-compose.local.yml"
ENV_FILE=".env.local"

POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-mytelco}"
POSTGRES_DB="${POSTGRES_DB:-mytelco}"
KEYCLOAK_PORT="${KEYCLOAK_PORT:-8080}"
PROMETHEUS_PORT="${PROMETHEUS_PORT:-9090}"
GRAFANA_PORT="${GRAFANA_PORT:-3005}"
OPENSEARCH_PORT="${OPENSEARCH_PORT:-9200}"
JAEGER_UI_PORT="${JAEGER_UI_PORT:-16686}"
KONG_PROXY_PORT="${KONG_PROXY_PORT:-8000}"
KONG_ADMIN_PORT="${KONG_ADMIN_PORT:-8001}"
KONG_ADMIN_TLS_PORT="${KONG_ADMIN_TLS_PORT:-8444}"
CUSTOMER_BFF_PORT="${CUSTOMER_BFF_PORT:-8081}"
ADMIN_BFF_PORT="${ADMIN_BFF_PORT:-8082}"
WEB_PORTAL_PORT="${WEB_PORTAL_PORT:-3000}"
ADMIN_PORTAL_PORT="${ADMIN_PORTAL_PORT:-3001}"

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: docker is required"
  exit 1
fi

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
else
  echo "INFO: $ENV_FILE not found. Falling back to defaults/.env.local.example values where applicable."
fi

compose_cmd=(docker compose)
if [[ -f "$ENV_FILE" ]]; then
  compose_cmd+=(--env-file "$ENV_FILE")
fi
compose_cmd+=(-f "$COMPOSE_FILE")

echo "==> Compose service state"
"${compose_cmd[@]}" ps

failures=0

check_http() {
  local name="$1"
  local url="$2"
  local timeout="${3:-60}"
  local interval="${4:-3}"
  local elapsed=0

  while (( elapsed < timeout )); do
    local code
    code="$(curl -k -sS -o /dev/null -w "%{http_code}" --max-time 5 "$url" || true)"

    if [[ "$code" =~ ^[1-4][0-9][0-9]$ ]]; then
      echo "[OK] $name -> $url (HTTP $code)"
      return 0
    fi

    sleep "$interval"
    elapsed=$((elapsed + interval))
  done

  echo "[FAIL] $name -> $url (timeout ${timeout}s)"
  return 1
}

check_http_contains() {
  local name="$1"
  local url="$2"
  local expected="$3"
  local timeout="${4:-60}"
  local interval="${5:-3}"
  local elapsed=0

  while (( elapsed < timeout )); do
    local body
    body="$(curl -k -sS --max-time 5 "$url" || true)"

    if [[ -n "$body" ]] && grep -q "$expected" <<<"$body"; then
      echo "[OK] $name -> $url contains '$expected'"
      return 0
    fi

    sleep "$interval"
    elapsed=$((elapsed + interval))
  done

  echo "[FAIL] $name -> $url missing expected content '$expected'"
  return 1
}

check_postgres() {
  local timeout="${1:-60}"
  local interval="${2:-3}"
  local elapsed=0

  while (( elapsed < timeout )); do
    if docker exec mytelco-postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
      echo "[OK] Postgres readiness -> pg_isready (container: mytelco-postgres)"
      return 0
    fi
    sleep "$interval"
    elapsed=$((elapsed + interval))
  done

  echo "[FAIL] Postgres readiness -> pg_isready (timeout ${timeout}s)"
  return 1
}

check_postgres_seed() {
  local timeout="${1:-60}"
  local interval="${2:-3}"
  local elapsed=0

  while (( elapsed < timeout )); do
    if docker exec mytelco-postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT seed_version FROM bootstrap.seed_info WHERE id = 1;" | grep -q "local-baseline-v1"; then
      echo "[OK] Postgres baseline seed -> bootstrap.seed_info(local-baseline-v1)"
      return 0
    fi
    sleep "$interval"
    elapsed=$((elapsed + interval))
  done

  echo "[FAIL] Postgres baseline seed -> bootstrap.seed_info(local-baseline-v1) not found"
  return 1
}

check_postgres || failures=$((failures + 1))
check_postgres_seed || failures=$((failures + 1))
check_http "Keycloak ready" "http://localhost:${KEYCLOAK_PORT}/health/ready" 90 3 || failures=$((failures + 1))
check_http "Keycloak login" "http://localhost:${KEYCLOAK_PORT}/realms/master/account" 60 3 || failures=$((failures + 1))
check_http "Kong admin" "https://localhost:${KONG_ADMIN_TLS_PORT}/" 60 3 || failures=$((failures + 1))
check_http "Kong proxy" "http://localhost:${KONG_PROXY_PORT}/" 60 3 || failures=$((failures + 1))
check_http "Customer BFF" "http://localhost:${CUSTOMER_BFF_PORT}/actuator/health" 90 3 || failures=$((failures + 1))
check_http "Admin BFF" "http://localhost:${ADMIN_BFF_PORT}/actuator/health" 90 3 || failures=$((failures + 1))
check_http_contains "Web portal real SPA" "http://localhost:${WEB_PORTAL_PORT}/" "<title>MyTelco - Customer Portal</title>" 60 3 || failures=$((failures + 1))
check_http_contains "Admin portal real SPA" "http://localhost:${ADMIN_PORTAL_PORT}/" "<title>MyTelco - Admin Portal</title>" 60 3 || failures=$((failures + 1))
check_http "Web portal API proxy" "http://localhost:${WEB_PORTAL_PORT}/api/v1/customer/account-overview" 90 3 || failures=$((failures + 1))

check_http "Prometheus ready" "http://localhost:${PROMETHEUS_PORT}/-/ready" 90 3 || failures=$((failures + 1))
check_http "Grafana health" "http://localhost:${GRAFANA_PORT}/api/health" 90 3 || failures=$((failures + 1))
check_http "OpenSearch cluster" "http://localhost:${OPENSEARCH_PORT}/_cluster/health?wait_for_status=yellow&timeout=1s" 30 3 || failures=$((failures + 1))
check_http "Jaeger UI" "http://localhost:${JAEGER_UI_PORT}/api/services" 60 3 || failures=$((failures + 1))

if (( failures > 0 )); then
  echo "Smoke check failed: ${failures} check(s) failed"
  exit 1
fi

echo "Smoke check passed: all checks succeeded"
