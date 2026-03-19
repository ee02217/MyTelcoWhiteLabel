#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-infra/docker/docker-compose.local.yml}"
ENV_FILE="${ENV_FILE:-.env.local}"
NAMESPACE_DATE="${EVIDENCE_DATE:-$(date +%F)}"
EVIDENCE_DIR="${EVIDENCE_DIR:-evidence/${NAMESPACE_DATE}}"
mkdir -p "${EVIDENCE_DIR}"

RUNS="${RUNS:-30}"
TARGET_SECONDS="${TARGET_SECONDS:-2.5}"
WEB_BASE_URL="${WEB_BASE_URL:-http://localhost:3000}"
RATE_KBPS="${RATE_KBPS:-1250}" # ~10 Mbps
RTT_MS="${RTT_MS:-150}"
CUSTOMER_API_PATH="${CUSTOMER_API_PATH:-/api/v1/customer/account-overview}"

OIDC_TOKEN_URL="${OIDC_TOKEN_URL:-http://keycloak:8080/realms/mytelco-white-label/protocol/openid-connect/token}"
OIDC_CLIENT_ID="${OIDC_CLIENT_ID:-web-portal}"
OIDC_USERNAME="${OIDC_USERNAME:-customer1}"
OIDC_PASSWORD="${OIDC_PASSWORD:-customer123}"
OIDC_SCOPE="${OIDC_SCOPE:-openid roles}"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
CSV_FILE="${EVIDENCE_DIR}/docker-dashboard-load-runs-${TIMESTAMP}.csv"
SUMMARY_FILE="${EVIDENCE_DIR}/docker-dashboard-load-summary-${TIMESTAMP}.md"

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
    code="$(curl -sS -o /tmp/docker-dashboard-health.txt -w '%{http_code}' "${url}" || true)"
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
  curl -sS -X POST "${OIDC_TOKEN_URL}" \
    --resolve keycloak:8080:127.0.0.1 \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    --data-urlencode "grant_type=password" \
    --data-urlencode "client_id=${OIDC_CLIENT_ID}" \
    --data-urlencode "username=${OIDC_USERNAME}" \
    --data-urlencode "password=${OIDC_PASSWORD}" \
    --data-urlencode "scope=${OIDC_SCOPE}" \
    | python3 -c 'import sys,json;print(json.load(sys.stdin)["access_token"])'
}

curl_time() {
  local url="$1"
  shift
  curl -sS --limit-rate "${RATE_KBPS}k" -o /dev/null -w '%{time_total}' "$@" "${url}"
}

require_cmd docker
require_cmd curl
require_cmd python3

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "[FAIL] ${ENV_FILE} not found"
  exit 1
fi

echo "== Docker dashboard load evidence (constrained profile) =="
echo "runs=${RUNS}, target=${TARGET_SECONDS}s, rate=${RATE_KBPS}KB/s, rtt=${RTT_MS}ms"

echo "[1/5] Ensure stack is up"
compose up -d --build
wait_http_200 "${WEB_BASE_URL}/" 180

API_PROBE_CODE="$(curl -sS -o /tmp/docker-dashboard-api-probe.txt -w '%{http_code}' "${WEB_BASE_URL}${CUSTOMER_API_PATH}" || true)"
if [[ "${API_PROBE_CODE}" != "200" && "${API_PROBE_CODE}" != "401" && "${API_PROBE_CODE}" != "403" ]]; then
  echo "[FAIL] unexpected API probe status from ${CUSTOMER_API_PATH}: ${API_PROBE_CODE}"
  exit 1
fi

echo "api_probe_status=${API_PROBE_CODE}"

echo "[2/5] Resolve SPA assets"
INDEX_HTML="$(curl -sS "${WEB_BASE_URL}/")"
JS_PATH="$(python3 -c 'import re,sys
html=sys.stdin.read()
m=re.search(r"src=\"(/assets/index-[^\"]+\.js)\"", html)
print(m.group(1) if m else "")' <<< "${INDEX_HTML}")"
CSS_PATH="$(python3 -c 'import re,sys
html=sys.stdin.read()
m=re.search(r"href=\"(/assets/index-[^\"]+\.css)\"", html)
print(m.group(1) if m else "")' <<< "${INDEX_HTML}")"

if [[ -z "${JS_PATH}" || -z "${CSS_PATH}" ]]; then
  echo "[FAIL] could not resolve SPA assets from index.html"
  exit 1
fi

echo "js_path=${JS_PATH}"
echo "css_path=${CSS_PATH}"

echo "[3/5] Acquire access token"
ACCESS_TOKEN="$(request_token)"
if [[ -z "${ACCESS_TOKEN}" ]]; then
  echo "[FAIL] unable to retrieve access token"
  exit 1
fi

echo "[4/5] Execute ${RUNS} constrained runs"
RTT_COMPONENT_S="$(python3 -c "print((${RTT_MS}/1000.0)*4)")"

echo "run,html_s,js_s,css_s,api_s,rtt_s,total_s,under_target" > "${CSV_FILE}"

for ((i = 1; i <= RUNS; i++)); do
  HTML_S="$(curl_time "${WEB_BASE_URL}/")"
  JS_S="$(curl_time "${WEB_BASE_URL}${JS_PATH}")"
  CSS_S="$(curl_time "${WEB_BASE_URL}${CSS_PATH}")"
  API_S="$(curl_time "${WEB_BASE_URL}${CUSTOMER_API_PATH}" -H "Authorization: Bearer ${ACCESS_TOKEN}")"

  TOTAL_S="$(python3 - <<PY
html=${HTML_S}
js=${JS_S}
css=${CSS_S}
api=${API_S}
rtt=${RTT_COMPONENT_S}
print(html+js+css+api+rtt)
PY
)"

  UNDER="0"
  if python3 - <<PY
import sys
sys.exit(0 if float('${TOTAL_S}') < float('${TARGET_SECONDS}') else 1)
PY
  then
    UNDER="1"
  fi

  echo "${i},${HTML_S},${JS_S},${CSS_S},${API_S},${RTT_COMPONENT_S},${TOTAL_S},${UNDER}" >> "${CSV_FILE}"

done

echo "[5/5] Build summary"
python3 - <<PY > "${SUMMARY_FILE}"
import csv
import statistics
from pathlib import Path

csv_file = Path("${CSV_FILE}")
rows = list(csv.DictReader(csv_file.open()))
if not rows:
    raise SystemExit("No rows collected")

target_s = float("${TARGET_SECONDS}")
rate_kbps = float("${RATE_KBPS}")
rate_mbps = (rate_kbps * 8.0) / 1000.0
rtt_ms = float("${RTT_MS}")
js_path = "${JS_PATH}"
css_path = "${CSS_PATH}"

totals = [float(r["total_s"]) for r in rows]
api = [float(r["api_s"]) for r in rows]
html = [float(r["html_s"]) for r in rows]
js = [float(r["js_s"]) for r in rows]
css = [float(r["css_s"]) for r in rows]

n = len(totals)
median = statistics.median(totals)
sorted_totals = sorted(totals)
p95 = sorted_totals[max(0, int(0.95 * n) - 1)]
pass_rate = sum(1 for t in totals if t < target_s) / n * 100

print("# Docker Dashboard Load Evidence (Constrained Profile)")
print()
print(f"- Runs: {n}")
print(f"- Target: < {target_s:.1f}s")
print(f"- Throughput cap: {rate_kbps:.0f} KB/s (~{rate_mbps:.1f} Mbps)")
print(f"- Synthetic RTT model: {rtt_ms:.0f}ms/request x 4 requests")
print(f"- SPA resources: {js_path}, {css_path}")
print()
print("## Results")
print()
print(f"- Median total load: {median:.3f}s")
print(f"- p95 total load: {p95:.3f}s")
print(f"- Pass rate (< {target_s:.1f}s): {pass_rate:.1f}%")
print(f"- Mean API segment: {statistics.mean(api):.3f}s")
print(f"- Mean HTML segment: {statistics.mean(html):.3f}s")
print(f"- Mean JS segment: {statistics.mean(js):.3f}s")
print(f"- Mean CSS segment: {statistics.mean(css):.3f}s")
print()
print("## Raw artifact")
print()
print(f"- {csv_file}")
PY

echo "summary=${SUMMARY_FILE}"
echo "csv=${CSV_FILE}"
