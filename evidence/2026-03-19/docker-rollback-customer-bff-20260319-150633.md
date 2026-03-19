# Docker Rollback-Equivalent Evidence

- Timestamp (UTC): 2026-03-19T15:06:54Z
- Service: customer-bff
- Compose file: infra/docker/docker-compose.local.yml
- Baseline image snapshot: mytelco-local-customer-bff:rollback-baseline-20260319-150633
- Simulated bad image: mytelco-local-customer-bff:rollback-bad-20260319-150633
- Health endpoint: http://localhost:8081/actuator/health

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

- Log: evidence/2026-03-19/docker-rollback-customer-bff-20260319-150633.log
