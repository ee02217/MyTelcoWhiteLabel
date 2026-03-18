#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE_FILE="$ROOT_DIR/infra/kong/kong.yml"
OUTPUT_FILE="${1:-$ROOT_DIR/infra/kong/kong.rendered.yml}"

required_env=(
  KONG_CUSTOMER_BFF_UPSTREAM
  KONG_ADMIN_BFF_UPSTREAM
  KONG_CUSTOMER_WEB_ORIGIN
  KONG_ADMIN_WEB_ORIGIN
  KONG_MOBILE_WEBVIEW_ORIGIN
  KONG_OIDC_ISSUER
  KONG_OIDC_JWKS_URI
  KONG_OIDC_AUDIENCE
  KONG_RATE_LIMIT_CUSTOMER_PER_MINUTE
  KONG_RATE_LIMIT_ADMIN_PER_MINUTE
)

for var_name in "${required_env[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "[render-kong] missing required env var: $var_name" >&2
    exit 1
  fi
done

if ! command -v envsubst >/dev/null 2>&1; then
  echo "[render-kong] envsubst not found. Install gettext (envsubst) and retry." >&2
  exit 1
fi

envsubst < "$TEMPLATE_FILE" > "$OUTPUT_FILE"

echo "[render-kong] rendered file: $OUTPUT_FILE"

if command -v deck >/dev/null 2>&1; then
  deck file validate "$OUTPUT_FILE"
  echo "[render-kong] deck validation OK"
elif command -v docker >/dev/null 2>&1; then
  docker run --rm -v "$ROOT_DIR:/work" -w /work kong/deck:latest file validate "${OUTPUT_FILE#$ROOT_DIR/}"
  echo "[render-kong] deck (docker) validation OK"
else
  echo "[render-kong] neither deck nor docker available; skipped validation" >&2
fi
