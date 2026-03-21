#!/usr/bin/env bash
set -euo pipefail

WEB_PORTAL_BASE_URL="${WEB_PORTAL_BASE_URL:-http://localhost:3000}"
A11Y_TAGS="${A11Y_TAGS:-wcag2a,wcag2aa,wcag21aa,wcag22aa}"
A11Y_TIMEOUT="${A11Y_TIMEOUT:-120}"

PAGES=(
  "${WEB_PORTAL_BASE_URL}/"
  "${WEB_PORTAL_BASE_URL}/callback"
)

ok(){ echo "[OK] $1"; }
fail(){ echo "[FAIL] $1"; exit 1; }

require_cmd(){
  command -v "$1" >/dev/null 2>&1 || fail "missing required command: $1"
}

wait_http_200(){
  local url="$1"
  local timeout_sec="${2:-120}"
  local started_at
  started_at="$(date +%s)"

  while true; do
    local status_code
    status_code="$(curl -sS -o /tmp/a11y-http-body.txt -w '%{http_code}' "$url" || true)"

    if [[ "$status_code" == "200" ]]; then
      return 0
    fi

    if (( $(date +%s) - started_at >= timeout_sec )); then
      fail "timeout waiting for HTTP 200 at $url (last status: $status_code)"
    fi

    sleep 2
  done
}

require_cmd curl
require_cmd npx

wait_http_200 "${WEB_PORTAL_BASE_URL}/" "$A11Y_TIMEOUT"

echo "[INFO] Installing browser + driver pair for axe"
install_output="$(npx browser-driver-manager install chrome 2>&1 || true)"
if [[ -n "$install_output" ]]; then
  echo "$install_output"
fi

which_output="$(npx browser-driver-manager which 2>&1 || true)"
chrome_path="$(echo "$which_output" | sed -n 's/^CHROME_TEST_PATH="\([^"]*\)"$/\1/p' | head -1)"
chromedriver_path="$(echo "$which_output" | sed -n 's/^CHROMEDRIVER_TEST_PATH="\([^"]*\)"$/\1/p' | head -1)"

for page in "${PAGES[@]}"; do
  echo "[INFO] Running axe accessibility scan for ${page}"

  if [[ -n "$chrome_path" && -x "$chrome_path" && -n "$chromedriver_path" && -x "$chromedriver_path" ]]; then
    npx @axe-core/cli "$page" \
      --tags "$A11Y_TAGS" \
      --timeout "$A11Y_TIMEOUT" \
      --chrome-path "$chrome_path" \
      --chromedriver-path "$chromedriver_path" \
      --chrome-options "no-sandbox,disable-dev-shm-usage" \
      --exit
  else
    npx @axe-core/cli "$page" \
      --tags "$A11Y_TAGS" \
      --timeout "$A11Y_TIMEOUT" \
      --chrome-options "no-sandbox,disable-dev-shm-usage" \
      --exit
  fi

  ok "Accessibility baseline passed for ${page}"
done

echo "WCAG accessibility baseline checks completed"
