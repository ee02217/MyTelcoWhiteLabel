# Docker BFF Performance Evidence

- Method: ApacheBench with bearer auth token
- Warm-up: 100 requests @ concurrency 10
- Main run: 1000 requests @ concurrency 20

| Endpoint                          | Samples | Failed | p50 (ms) | p95 (ms) | p99 (ms) | Max (ms) |   Req/s | Threshold (p95) | Result |
| --------------------------------- | ------: | -----: | -------: | -------: | -------: | -------: | ------: | --------------: | ------ |
| /api/v1/customer/dashboard        |    1000 |      0 |        9 |       18 |       24 |       30 | 2098.09 |         < 400ms | PASS   |
| /api/v1/customer/account-overview |    1000 |      0 |        6 |       12 |       15 |       22 | 3143.03 |         < 400ms | PASS   |

## Raw Artifacts

- evidence/2026-03-19/docker-bff-dashboard-ab-20260319-150832.txt
- evidence/2026-03-19/docker-bff-account-overview-ab-20260319-150832.txt
- evidence/2026-03-19/docker-bff-performance-summary-20260319-150832.csv
