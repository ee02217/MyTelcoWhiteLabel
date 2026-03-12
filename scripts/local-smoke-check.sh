#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="infra/docker/docker-compose.local.yml"
ENV_FILE=".env.local"

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: docker is required"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "INFO: $ENV_FILE not found. Falling back to .env.local.example values where applicable."
fi

compose_cmd=(docker compose -f "$COMPOSE_FILE")
if [[ -f "$ENV_FILE" ]]; then
  compose_cmd+=(--env-file "$ENV_FILE")
fi

echo "==> Compose service state"
"${compose_cmd[@]}" ps

declare -a checks=(
  "Keycloak|http://localhost:8080/health/ready"
  "Kong Admin|http://localhost:8001/status"
  "Customer BFF|http://localhost:8081/actuator/health"
  "Admin BFF|http://localhost:8082/actuator/health"
  "Web Portal|http://localhost:3000"
  "Admin Portal|http://localhost:3001"
)

failures=0
for entry in "${checks[@]}"; do
  name="${entry%%|*}"
  url="${entry##*|}"

  if curl -fsS "$url" >/dev/null; then
    echo "[OK] $name -> $url"
  else
    echo "[FAIL] $name -> $url"
    failures=$((failures + 1))
  fi
done

if [[ $failures -gt 0 ]]; then
  echo "Smoke check failed: $failures endpoint(s) unreachable"
  exit 1
fi

echo "Smoke check passed: all endpoints reachable"
