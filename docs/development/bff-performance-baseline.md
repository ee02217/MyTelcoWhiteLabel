# BFF Performance Baseline

## Objective

p95 response time for BFF aggregated endpoints must be **< 400ms** in staging/production baseline.

## Performance Targets

| Endpoint                         | Target p95 | Target p50 | Measurement Method |
| -------------------------------- | ---------- | ---------- | ------------------ |
| `GET /api/v1/customer/dashboard` | < 400ms    | < 150ms    | Micrometer Timer   |
| `GET /api/v1/admin/dashboard`    | < 400ms    | < 150ms    | Micrometer Timer   |

## Instrumentation

Both BFF services use **Micrometer** for metrics collection:

```java
Timer.builder("customer.dashboard.aggregation")
    .description("Time taken to aggregate customer dashboard data")
    .publishPercentiles(0.50, 0.95, 0.99)
    .register(meterRegistry);
```

### Metrics Available

- `customer.dashboard.aggregation` - Customer BFF aggregation timer
- `admin.dashboard.aggregation` - Admin BFF aggregation timer

### Accessing Metrics

```bash
# Local metrics
curl http://localhost:8081/actuator/metrics/customer.dashboard.aggregation
curl http://localhost:8082/actuator/metrics/admin.dashboard.aggregation

# Prometheus format
curl http://localhost:8081/actuator/prometheus | grep dashboard.aggregation
```

## Docker Baseline Measurement (docker-only runtime)

### Prerequisites

- Docker Engine + Compose plugin
- ApacheBench (`ab`)
- Local stack started (`bash scripts/local-smoke-check.sh` should pass)

### Running Performance Tests

```bash
bash scripts/docker-bff-performance-evidence.sh
```

What the script does:

- boots/rebuilds local docker stack if needed
- acquires bearer token from local Keycloak
- runs warm-up and authenticated benchmark for:
  - `GET /api/v1/customer/dashboard`
  - `GET /api/v1/customer/account-overview`
- exports p50/p95/p99, max, req/s, sample count, failed count

Artifacts are written to `evidence/YYYY-MM-DD/`:

- `docker-bff-*-ab-<timestamp>.txt` (raw ApacheBench output)
- `docker-bff-performance-summary-<timestamp>.md`
- `docker-bff-performance-summary-<timestamp>.csv`

_Note: This validates docker-local behavior and instrumentation. It is not a substitute for production-like network/dependency latency._

## Stage/Production Measurement

### Prometheus + Grafana

1. BFF services expose `/actuator/prometheus` endpoint
2. Configure Prometheus to scrape BFF endpoints
3. Use Grafana dashboard with query:
   ```promql
   histogram_quantile(0.95, rate(customer_dashboard_aggregation_seconds_bucket[5m]))
   ```

### Load Testing

```bash
# Using hey or wrk
hey -n 1000 -c 10 http://<bff-host>/api/v1/customer/dashboard
```

## Optimization Guidelines

If p95 exceeds 400ms:

1. **Profile** - Check which provider call is slowest
2. **Parallelize** - Use `CompletableFuture` for independent provider calls
3. **Cache** - Add caching for rarely changing data (e.g., tenant config)
4. **Circuit Break** - Add resilience patterns for failing providers
5. **Scale** - Horizontal scaling via Kubernetes HPA

## Alerting

Recommended Prometheus alerts:

```yaml
- alert: BFFP95LatencyHigh
  expr: histogram_quantile(0.95, rate(customer_dashboard_aggregation_seconds_bucket[5m])) > 0.4
  for: 5m
  labels:
    severity: warning
```
