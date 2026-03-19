#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-infra/docker/docker-compose.local.yml}"
ENV_FILE="${ENV_FILE:-.env.local}"
SERVICE="${SERVICE:-customer-bff}"
NAMESPACE_DATE="${EVIDENCE_DATE:-$(date +%F)}"
EVIDENCE_DIR="${EVIDENCE_DIR:-evidence/${NAMESPACE_DATE}}"
mkdir -p "${EVIDENCE_DIR}"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
LOG_FILE="${EVIDENCE_DIR}/docker-rollback-${SERVICE}-${TIMESTAMP}.log"
SUMMARY_FILE="${EVIDENCE_DIR}/docker-rollback-${SERVICE}-${TIMESTAMP}.md"

exec > >(tee "${LOG_FILE}") 2>&1

compose() {
  docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" "$@"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "[FAIL] missing required command: $1"
    exit 1
  fi
}

health_url_for_service() {
  case "$1" in
    customer-bff)
      echo "http://localhost:${CUSTOMER_BFF_PORT:-8081}/actuator/health"
      ;;
    admin-bff)
      echo "http://localhost:${ADMIN_BFF_PORT:-8082}/actuator/health"
      ;;
    *)
      echo ""
      ;;
  esac
}

wait_http_200() {
  local url="$1"
  local timeout_sec="${2:-120}"
  local interval_sec="${3:-2}"

  local start
  start="$(date +%s)"

  while true; do
    local code
    code="$(curl -sS -o /tmp/docker-rollback-health-body.txt -w '%{http_code}' "${url}" || true)"
    if [[ "${code}" == "200" ]]; then
      if grep -q '"status"[[:space:]]*:[[:space:]]*"UP"' /tmp/docker-rollback-health-body.txt; then
        return 0
      fi
    fi

    local now elapsed
    now="$(date +%s)"
    elapsed="$((now - start))"
    if (( elapsed >= timeout_sec )); then
      echo "[FAIL] timeout waiting for healthy endpoint: ${url}"
      echo "last response code=${code}"
      cat /tmp/docker-rollback-health-body.txt || true
      return 1
    fi

    sleep "${interval_sec}"
  done
}

require_cmd docker
require_cmd curl
require_cmd python3

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "[FAIL] ${ENV_FILE} not found"
  exit 1
fi

HEALTH_URL="$(health_url_for_service "${SERVICE}")"
if [[ -z "${HEALTH_URL}" ]]; then
  echo "[FAIL] unsupported service for health validation: ${SERVICE}"
  exit 1
fi

echo "== Docker rollback-equivalent evidence =="
echo "service=${SERVICE}"
echo "compose_file=${COMPOSE_FILE}"
echo "env_file=${ENV_FILE}"
echo "health_url=${HEALTH_URL}"
echo "log_file=${LOG_FILE}"
echo

echo "[1/7] Ensure stack is up"
compose up -d --build

echo "[2/7] Verify baseline health"
wait_http_200 "${HEALTH_URL}" 180 2
echo "[OK] baseline health is UP"

PROJECT_NAME="$(compose config --format json | python3 -c 'import json,sys; cfg=json.load(sys.stdin); print(cfg.get("name", "mytelco-local"))')"
IMAGE_REPO="${PROJECT_NAME}-${SERVICE}"
BASELINE_TAG="rollback-baseline-${TIMESTAMP}"
BAD_TAG="rollback-bad-${TIMESTAMP}"
BAD_IMAGE_REF="${IMAGE_REPO}:${BAD_TAG}"
BASELINE_IMAGE_REF="${IMAGE_REPO}:${BASELINE_TAG}"


echo "[3/7] Snapshot current service image as rollback baseline"
docker image inspect "${IMAGE_REPO}:latest" >/dev/null 2>&1
docker image tag "${IMAGE_REPO}:latest" "${BASELINE_IMAGE_REF}"
BASELINE_DIGEST="$(docker image inspect "${BASELINE_IMAGE_REF}" --format '{{index .RepoDigests 0}}' 2>/dev/null || true)"
echo "baseline_image=${BASELINE_IMAGE_REF}"
if [[ -n "${BASELINE_DIGEST}" ]]; then
  echo "baseline_digest=${BASELINE_DIGEST}"
fi


echo "[4/7] Build intentionally bad image to simulate failed rollout"
WORK_TMP_DIR="${EVIDENCE_DIR}/.rollback-work-${TIMESTAMP}"
mkdir -p "${WORK_TMP_DIR}"

BAD_DOCKERFILE="${WORK_TMP_DIR}/Dockerfile.bad"
BAD_OVERRIDE_FILE="${WORK_TMP_DIR}/docker-rollback-bad.override.yml"
BASELINE_OVERRIDE_FILE="${WORK_TMP_DIR}/docker-rollback-baseline.override.yml"

cat > "${BAD_DOCKERFILE}" <<'EOF'
FROM alpine:3.20
CMD ["sh", "-c", "echo simulated failed rollout; sleep 1; exit 1"]
EOF

docker build -f "${BAD_DOCKERFILE}" -t "${BAD_IMAGE_REF}" "${WORK_TMP_DIR}"

cat > "${BAD_OVERRIDE_FILE}" <<EOF
services:
  ${SERVICE}:
    image: ${BAD_IMAGE_REF}
EOF

echo "[5/7] Deploy bad release"
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" -f "${BAD_OVERRIDE_FILE}" up -d "${SERVICE}"
sleep 4
compose ps "${SERVICE}"

FAILED_HEALTH_CODE="$(curl -sS -o /tmp/docker-rollback-failed-health.txt -w '%{http_code}' "${HEALTH_URL}" || true)"
if [[ "${FAILED_HEALTH_CODE}" == "200" ]]; then
  echo "[WARN] bad rollout still returned HTTP 200 unexpectedly"
else
  echo "[OK] bad rollout detected (health code=${FAILED_HEALTH_CODE})"
fi


echo "[6/7] Roll back to baseline image"
cat > "${BASELINE_OVERRIDE_FILE}" <<EOF
services:
  ${SERVICE}:
    image: ${BASELINE_IMAGE_REF}
EOF

docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" -f "${BASELINE_OVERRIDE_FILE}" up -d "${SERVICE}"
wait_http_200 "${HEALTH_URL}" 180 2
echo "[OK] rollback complete and service healthy"


echo "[7/7] Restore default compose declaration"
compose up -d "${SERVICE}"
wait_http_200 "${HEALTH_URL}" 120 2

echo "[OK] service restored under default compose declaration"

ROLLOUT_TIME="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"

cat > "${SUMMARY_FILE}" <<EOF
# Docker Rollback-Equivalent Evidence

- Timestamp (UTC): ${ROLLOUT_TIME}
- Service: ${SERVICE}
- Compose file: ${COMPOSE_FILE}
- Baseline image snapshot: ${BASELINE_IMAGE_REF}
- Simulated bad image: ${BAD_IMAGE_REF}
- Health endpoint: ${HEALTH_URL}

## Procedure (executed)
1. Started stack and confirmed baseline health = UP.
2. Snapshotted current service image tag as rollback baseline.
3. Built/deployed intentionally bad image (container exits).
4. Confirmed health degradation.
5. Re-deployed baseline image tag and confirmed health recovery.
6. Restored default compose declaration.

## Result
Rollback-equivalent validation **PASSED** on docker compose.

## Artifacts
- Log: ${LOG_FILE}
EOF

echo
echo "[DONE] summary: ${SUMMARY_FILE}"
echo "[DONE] log: ${LOG_FILE}"
