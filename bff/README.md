# BFF Services

Backend-for-Frontend (BFF) services for the Telco Self-Care White-Label Platform.

## Overview

This directory contains multiple BFF services, each dedicated to a specific frontend:

| BFF Service | Port | Purpose |
|-------------|------|---------|
| `customer-bff` | 8081 | Customer-facing self-care portal |
| `admin-bff` | 8082 | Admin management portal |

## Tech Stack

- **Framework:** Spring Boot 3.3.0
- **Language:** Java 21
- **Build Tool:** Maven
- **Metrics:** Micrometer with Prometheus export

## Services

### Customer BFF

**Purpose:** Aggregates data for the customer self-care portal.

**Endpoints:**
- `GET /api/v1/customer/dashboard` - Aggregated customer dashboard (account, usage, billing)
- `GET /api/v1/customer/{customerId}/dashboard` - Customer-specific dashboard

**API Docs:** `http://localhost:8081/swagger-ui.html`

### Admin BFF

**Purpose:** Aggregates data for the admin management portal.

**Endpoints:**
- `GET /api/v1/admin/dashboard` - Aggregated admin dashboard (tenant, offers, operations)
- `GET /api/v1/admin/{tenantId}/dashboard` - Tenant-specific dashboard

**API Docs:** `http://localhost:8082/swagger-ui.html`

## Getting Started

### Prerequisites

| Tool     | Version |
| -------- | ------- |
| Java JDK | ≥21     |
| Maven    | ≥3.8    |

### Building All BFFs

```bash
cd bff

# Build customer-bff
cd customer-bff
mvn clean package

# Build admin-bff
cd ../admin-bff
mvn clean package
```

### Running Services

```bash
# Terminal 1 - Customer BFF
cd bff/customer-bff
mvn spring-boot:run

# Terminal 2 - Admin BFF
cd bff/admin-bff
mvn spring-boot:run
```

### Running Tests

```bash
# Customer BFF tests
cd bff/customer-bff
mvn test

# Admin BFF tests
cd bff/admin-bff
mvn test
```

### Docker Build

```bash
# Customer BFF
cd bff/customer-bff
docker build -t mytelco/customer-bff:latest .

# Admin BFF
cd bff/admin-bff
docker build -t mytelco/admin-bff:latest .
```

### Helm Deployment

```bash
# Deploy Customer BFF
helm install customer-bff ./customer-bff/helm \
  --set image.repository=mytelco/customer-bff \
  --set image.tag=latest

# Deploy Admin BFF
helm install admin-bff ./admin-bff/helm \
  --set image.repository=mytelco/admin-bff \
  --set image.tag=latest
```

## Project Structure

```
bff/
├── customer-bff/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/mytelco/customerbff/
│   │   │   │   ├── CustomerBffApplication.java
│   │   │   │   ├── controller/
│   │   │   │   │   └── CustomerDashboardController.java
│   │   │   │   ├── service/
│   │   │   │   │   └── CustomerAggregationService.java
│   │   │   │   ├── provider/
│   │   │   │   │   ├── AccountProvider.java
│   │   │   │   │   ├── UsageProvider.java
│   │   │   │   │   └── BillingProvider.java
│   │   │   │   └── model/
│   │   │   │       └── *.java
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/
│   │       └── java/
│   ├── helm/
│   │   ├── Chart.yaml
│   │   ├── values.yaml
│   │   └── templates/
│   ├── Dockerfile
│   └── pom.xml
│
├── admin-bff/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/mytelco/adminbff/
│   │   │   │   ├── AdminBffApplication.java
│   │   │   │   ├── controller/
│   │   │   │   │   └── AdminDashboardController.java
│   │   │   │   ├── service/
│   │   │   │   │   └── AdminAggregationService.java
│   │   │   │   ├── provider/
│   │   │   │   │   ├── TenantProvider.java
│   │   │   │   │   ├── OfferProvider.java
│   │   │   │   │   └── OpsProvider.java
│   │   │   │   └── model/
│   │   │   │       └── *.java
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/
│   │       └── java/
│   ├── helm/
│   │   ├── Chart.yaml
│   │   ├── values.yaml
│   │   └── templates/
│   ├── Dockerfile
│   └── pom.xml
│
└── README.md
```

## Health & Metrics

All BFF services include Spring Boot Actuator:

| Endpoint | Path | Description |
|----------|------|-------------|
| Health | `/actuator/health` | Overall health status |
| Liveness | `/actuator/health/liveness` | K8s liveness probe |
| Readiness | `/actuator/health/readiness` | K8s readiness probe |
| Metrics | `/actuator/metrics` | Application metrics |
| Prometheus | `/actuator/prometheus` | Prometheus export |

### Performance Metrics

BFF aggregation endpoints expose timing metrics:
- `customer.dashboard.aggregation` - Customer dashboard timing
- `admin.dashboard.aggregation` - Admin dashboard timing

p50, p95, p99 percentiles are published.

See [docs/development/bff-performance-baseline.md](../../docs/development/bff-performance-baseline.md) for detailed performance targets and measurement methodology.

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SERVER_PORT` | HTTP port | 8081/8082 |
| `SPRING_PROFILES_ACTIVE` | Spring profile | dev |

### Customer BFF Properties

- `server.port`: 8081
- `spring.application.name`: customer-bff

### Admin BFF Properties

- `server.port`: 8082
- `spring.application.name`: admin-bff

## Aggregation Pattern

Each BFF uses a provider pattern to aggregate data:

```java
@Service
public class CustomerAggregationService {
    private final AccountProvider accountProvider;
    private final UsageProvider usageProvider;
    private final BillingProvider billingProvider;
    
    public CustomerDashboardResponse getDashboard(String customerId) {
        // Fetch from providers (parallelize in production)
        AccountSummary account = accountProvider.getAccountSummary(customerId);
        UsageSummary usage = usageProvider.getUsageSummary(customerId);
        BillingSummary billing = billingProvider.getBillingSummary(customerId);
        
        return new CustomerDashboardResponse(account, usage, billing, Instant.now());
    }
}
```

## Next Steps

- [ ] Add authentication (Spring Security)
- [ ] Add API Gateway integration
- [ ] Add caching (Spring Cache)
- [ ] Add circuit breaker (Resilience4j)
- [ ] Connect to real backend services
- [ ] Configure logging aggregation
