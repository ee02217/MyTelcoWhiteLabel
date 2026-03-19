#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROD_REL="infra/kong/kong.yml"
LOCAL_REL="infra/kong/kong.local.yml"
PROD_CONFIG="$ROOT_DIR/$PROD_REL"
LOCAL_CONFIG="$ROOT_DIR/$LOCAL_REL"

if [[ ! -f "$PROD_CONFIG" ]]; then
  echo "[kong-validate] missing production config: $PROD_CONFIG" >&2
  exit 1
fi

if [[ ! -f "$LOCAL_CONFIG" ]]; then
  echo "[kong-validate] missing local config: $LOCAL_CONFIG" >&2
  exit 1
fi

echo "[kong-validate] static guard checks"

if grep -n "TODO" "$PROD_CONFIG" >/dev/null; then
  echo "[kong-validate] TODO placeholders are not allowed in production Kong config" >&2
  grep -n "TODO" "$PROD_CONFIG" >&2
  exit 1
fi

if grep -nE "^\s*-\s*['\"]?\*['\"]?\s*$" "$PROD_CONFIG" >/dev/null; then
  echo "[kong-validate] wildcard CORS origins are not allowed in production Kong config" >&2
  grep -nE "^\s*-\s*['\"]?\*['\"]?\s*$" "$PROD_CONFIG" >&2
  exit 1
fi

required_markers=(
  "KONG_CUSTOMER_BFF_UPSTREAM"
  "KONG_ADMIN_BFF_UPSTREAM"
  "KONG_CUSTOMER_WEB_ORIGIN"
  "KONG_ADMIN_WEB_ORIGIN"
  "KONG_OIDC_ISSUER"
  "KONG_OIDC_JWKS_URI"
)

for marker in "${required_markers[@]}"; do
  if ! grep -q "$marker" "$PROD_CONFIG"; then
    echo "[kong-validate] missing required production marker: $marker" >&2
    exit 1
  fi
done

echo "[kong-validate] decK file validation"
if command -v deck >/dev/null 2>&1; then
  (
    cd "$ROOT_DIR"
    deck file validate "$PROD_REL"
    deck file validate "$LOCAL_REL"
  )
elif command -v docker >/dev/null 2>&1; then
  docker run --rm -v "$ROOT_DIR:/work" -w /work kong/deck:latest file validate "$PROD_REL"
  docker run --rm -v "$ROOT_DIR:/work" -w /work kong/deck:latest file validate "$LOCAL_REL"
else
  echo "[kong-validate] neither deck nor docker is available for validation" >&2
  exit 1
fi

echo "[kong-validate] OK"
