#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-infra/docker/docker-compose.local.yml}"
ENV_FILE="${ENV_FILE:-.env.local}"
NAMESPACE_DATE="${EVIDENCE_DATE:-$(date +%F)}"
EVIDENCE_DIR="${EVIDENCE_DIR:-evidence/${NAMESPACE_DATE}}"
mkdir -p "${EVIDENCE_DIR}"

REQUESTS="${REQUESTS:-1000}"
CONCURRENCY="${CONCURRENCY:-20}"
WARMUP_REQUESTS="${WARMUP_REQUESTS:-100}"
WARMUP_CONCURRENCY="${WARMUP_CONCURRENCY:-10}"
CUSTOMER_BFF_BASE_URL="${CUSTOMER_BFF_BASE_URL:-http://localhost:8081}"
OIDC_TOKEN_URL="${OIDC_TOKEN_URL:-http://keycloak:8080/realms/mytelco-white-label/protocol/openid-connect/token}"
OIDC_CLIENT_ID="${OIDC_CLIENT_ID:-web-portal}"
OIDC_USERNAME="${OIDC_USERNAME:-customer1}"
OIDC_PASSWORD="${OIDC_PASSWORD:-customer123}"
OIDC_SCOPE="${OIDC_SCOPE:-openid roles}"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
LOG_DASHBOARD="${EVIDENCE_DIR}/docker-bff-dashboard-ab-${TIMESTAMP}.txt"
LOG_ACCOUNT_OVERVIEW="${EVIDENCE_DIR}/docker-bff-account-overview-ab-${TIMESTAMP}.txt"
SUMMARY_FILE="${EVIDENCE_DIR}/docker-bff-performance-summary-${TIMESTAMP}.md"
CSV_FILE="${EVIDENCE_DIR}/docker-bff-performance-summary-${TIMESTAMP}.csv"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "[FAIL] missing required command: $1"
    exit 1
  fi
}

compose() {
  docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" "$@"
}

wait_http_200() {
  local url="$1"
  local timeout_sec="${2:-120}"
  local start
  start="$(date +%s)"

  while true; do
    local code
    code="$(curl -sS -o /tmp/docker-bff-health.txt -w '%{http_code}' "${url}" || true)"
    if [[ "${code}" == "200" ]]; then
      return 0
    fi

    if (( $(date +%s) - start >= timeout_sec )); then
      echo "[FAIL] timeout waiting for HTTP 200: ${url}"
      return 1
    fi

    sleep 2
  done
}

request_token() {
  local token
  token="$(
    curl -sS -X POST "${OIDC_TOKEN_URL}" \
      --resolve keycloak:8080:127.0.0.1 \
      -H 'Content-Type: application/x-www-form-urlencoded' \
      --data-urlencode "grant_type=password" \
      --data-urlencode "client_id=${OIDC_CLIENT_ID}" \
      --data-urlencode "username=${OIDC_USERNAME}" \
      --data-urlencode "password=${OIDC_PASSWORD}" \
      --data-urlencode "scope=${OIDC_SCOPE}" \
      | python3 -c 'import sys,json;print(json.load(sys.stdin)["access_token"])'
  )"

  if [[ -z "${token}" ]]; then
    echo "[FAIL] unable to retrieve access token"
    exit 1
  fi

  echo "${token}"
}

parse_ab_metric() {
  local file="$1"
  local key="$2"
  case "$key" in
    complete)
      awk -F':' '/Complete requests/ {gsub(/^[ \t]+/, "", $2); print $2}' "${file}" | tail -n1
      ;;
    failed)
      awk -F':' '/Failed requests/ {gsub(/^[ \t]+/, "", $2); print $2}' "${file}" | tail -n1
      ;;
    rps)
      awk '/Requests per second/ {print $4}' "${file}" | tail -n1
      ;;
    p50)
      awk '/^[[:space:]]*50%/ {print $2}' "${file}" | tail -n1
      ;;
    p95)
      awk '/^[[:space:]]*95%/ {print $2}' "${file}" | tail -n1
      ;;
    p99)
      awk '/^[[:space:]]*99%/ {print $2}' "${file}" | tail -n1
      ;;
    max)
      awk '/^[[:space:]]*100%/ {print $2}' "${file}" | tail -n1
      ;;
    *)
      echo ""
      ;;
  esac
}

run_ab() {
  local endpoint="$1"
  local output_file="$2"
  local token="$3"

  local url="${CUSTOMER_BFF_BASE_URL}${endpoint}"

  echo "[warm-up] endpoint=${endpoint} requests=${WARMUP_REQUESTS} concurrency=${WARMUP_CONCURRENCY}"
  ab -l -n "${WARMUP_REQUESTS}" -c "${WARMUP_CONCURRENCY}" -q -H "Authorization: Bearer ${token}" "${url}" >/dev/null

  echo "[benchmark] endpoint=${endpoint} requests=${REQUESTS} concurrency=${CONCURRENCY}"
  ab -l -n "${REQUESTS}" -c "${CONCURRENCY}" -H "Authorization: Bearer ${token}" "${url}" | tee "${output_file}" >/dev/null
}

require_cmd docker
require_cmd curl
require_cmd python3
require_cmd ab

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "[FAIL] ${ENV_FILE} not found"
  exit 1
fi

echo "== Docker BFF performance evidence =="
echo "requests=${REQUESTS}, concurrency=${CONCURRENCY}, warmup=${WARMUP_REQUESTS}@${WARMUP_CONCURRENCY}"

echo "[1/4] Ensure stack is up"
compose up -d --build
wait_http_200 "${CUSTOMER_BFF_BASE_URL}/actuator/health" 180

echo "[2/4] Acquire auth token"
ACCESS_TOKEN="$(request_token)"

echo "[3/4] Run benchmarks"
run_ab "/api/v1/customer/dashboard" "${LOG_DASHBOARD}" "${ACCESS_TOKEN}"
run_ab "/api/v1/customer/account-overview" "${LOG_ACCOUNT_OVERVIEW}" "${ACCESS_TOKEN}"

D_COMPLETE="$(parse_ab_metric "${LOG_DASHBOARD}" complete)"
D_FAILED="$(parse_ab_metric "${LOG_DASHBOARD}" failed)"
D_P50="$(parse_ab_metric "${LOG_DASHBOARD}" p50)"
D_P95="$(parse_ab_metric "${LOG_DASHBOARD}" p95)"
D_P99="$(parse_ab_metric "${LOG_DASHBOARD}" p99)"
D_MAX="$(parse_ab_metric "${LOG_DASHBOARD}" max)"
D_RPS="$(parse_ab_metric "${LOG_DASHBOARD}" rps)"

A_COMPLETE="$(parse_ab_metric "${LOG_ACCOUNT_OVERVIEW}" complete)"
A_FAILED="$(parse_ab_metric "${LOG_ACCOUNT_OVERVIEW}" failed)"
A_P50="$(parse_ab_metric "${LOG_ACCOUNT_OVERVIEW}" p50)"
A_P95="$(parse_ab_metric "${LOG_ACCOUNT_OVERVIEW}" p95)"
A_P99="$(parse_ab_metric "${LOG_ACCOUNT_OVERVIEW}" p99)"
A_MAX="$(parse_ab_metric "${LOG_ACCOUNT_OVERVIEW}" max)"
A_RPS="$(parse_ab_metric "${LOG_ACCOUNT_OVERVIEW}" rps)"

PASS_DASHBOARD="FAIL"
PASS_ACCOUNT="FAIL"
if [[ -n "${D_P95}" ]] && (( D_P95 < 400 )); then
  PASS_DASHBOARD="PASS"
fi
if [[ -n "${A_P95}" ]] && (( A_P95 < 400 )); then
  PASS_ACCOUNT="PASS"
fi

cat > "${CSV_FILE}" <<EOF
endpoint,sample_count,failed,p50_ms,p95_ms,p99_ms,max_ms,requests_per_sec,threshold_p95_ms,result
/api/v1/customer/dashboard,${D_COMPLETE},${D_FAILED},${D_P50},${D_P95},${D_P99},${D_MAX},${D_RPS},400,${PASS_DASHBOARD}
/api/v1/customer/account-overview,${A_COMPLETE},${A_FAILED},${A_P50},${A_P95},${A_P99},${A_MAX},${A_RPS},400,${PASS_ACCOUNT}
EOF

cat > "${SUMMARY_FILE}" <<EOF
# Docker BFF Performance Evidence

- Method: ApacheBench with bearer auth token
- Warm-up: ${WARMUP_REQUESTS} requests @ concurrency ${WARMUP_CONCURRENCY}
- Main run: ${REQUESTS} requests @ concurrency ${CONCURRENCY}

| Endpoint | Samples | Failed | p50 (ms) | p95 (ms) | p99 (ms) | Max (ms) | Req/s | Threshold (p95) | Result |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| /api/v1/customer/dashboard | ${D_COMPLETE} | ${D_FAILED} | ${D_P50} | ${D_P95} | ${D_P99} | ${D_MAX} | ${D_RPS} | < 400ms | ${PASS_DASHBOARD} |
| /api/v1/customer/account-overview | ${A_COMPLETE} | ${A_FAILED} | ${A_P50} | ${A_P95} | ${A_P99} | ${A_MAX} | ${A_RPS} | < 400ms | ${PASS_ACCOUNT} |

## Raw Artifacts
- ${LOG_DASHBOARD}
- ${LOG_ACCOUNT_OVERVIEW}
- ${CSV_FILE}
EOF

echo "[4/4] Done"
echo "summary=${SUMMARY_FILE}"
echo "csv=${CSV_FILE}"
