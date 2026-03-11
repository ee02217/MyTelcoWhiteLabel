# BFF Service

Backend-for-Frontend (BFF) service template for the Telco Self-Care White-Label Platform.

## Tech Stack

- **Framework:** Spring Boot 3.3.0 with WebFlux
- **Language:** Java 21
- **Build Tool:** Maven

## Purpose

The BFF pattern provides a dedicated backend service for each frontend application, 
aggregating data from multiple backend services and providing a simplified API.

## Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| Java JDK | ≥21 |
| Maven | ≥3.8 |

### Installation & Build

```bash
# Build the application
mvn clean package

# Run the application
mvn spring-boot:run

# Run tests
mvn test
```

### Docker Build

```bash
# Build Docker image
docker build -t mytelco/bff-service:latest .

# Run Docker container
docker run -p 8081:8081 mytelco/bff-service:latest
```

### Helm Deployment

```bash
# Deploy to Kubernetes
helm install bff-service ./helm \
  --set image.repository=mytelco/bff-service \
  --set image.tag=latest
```

## Project Structure

```
bff/
├── src/
│   ├── main/
│   │   ├── java/com/mytelco/bff/
│   │   │   ├── BffServiceApplication.java
│   │   │   └── controller/
│   │   │       └── SampleBffController.java
│   │   └── resources/
│   │       └── application.yml
│   └── test/
│       └── java/
├── helm/
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
│       ├── _helpers.tpl
│       ├── deployment.yaml
│       └── service.yaml
├── Dockerfile
├── pom.xml
└── README.md
```

## Health Endpoints

The service includes Spring Boot Actuator with the following endpoints:

| Endpoint | Path | Description |
|----------|------|-------------|
| Health | `/actuator/health` | Overall health status |
| Liveness | `/actuator/health/liveness` | Kubernetes liveness probe |
| Readiness | `/actuator/health/readiness` | Kubernetes readiness probe |
| Info | `/actuator/info` | Application information |
| Metrics | `/actuator/metrics` | Application metrics |
| Prometheus | `/actuator/prometheus` | Prometheus metrics export |

## Creating a New BFF from Template

1. **Copy the template:**
   ```bash
   cp -r bff bff-my-feature
   ```

2. **Update package structure:**
   - Rename `com/mytelco/bff` to `com/mytelco/bff/my-feature`
   - Update package declarations in Java files

3. **Update configuration:**
   - Edit `pom.xml` - change artifactId and app name
   - Edit `application.yml` - set service port and backend URLs

4. **Implement BFF logic:**
   - Use `WebClient` to call backend services
   - Aggregate and transform responses for frontend

5. **Update Helm chart:**
   - Edit `helm/Chart.yaml` - update name and description
   - Edit `helm/values.yaml` - set image repository

6. **Build and test:**
   ```bash
   mvn clean package
   mvn spring-boot:run
   ```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SERVER_PORT` | HTTP port | 8081 |
| `SPRING_PROFILES_ACTIVE` | Spring profile | dev |

### Application Properties

Key properties in `application.yml`:
- `server.port` - HTTP listener port (default: 8081)
- `spring.application.name` - Application name
- `bff.backend-services.base-url` - Backend services URL
- `bff.backend-services.timeout` - Backend call timeout

## API Endpoints

Sample endpoints:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Service health check |
| GET | `/api/v1/info` | Service information |
| GET | `/api/v1/dashboard` | Aggregated dashboard data |

## BFF Pattern Implementation

The BFF uses Spring WebFlux for reactive programming:

```java
@Service
public class MyBffService {
    
    private final WebClient webClient;
    
    public Mono<DashboardData> getDashboard() {
        return Mono.zip(
            userService.getUserData(),
            accountService.getAccountData(),
            usageService.getUsageData()
        ).map(tuple -> new DashboardData(
            tuple.getT1(),
            tuple.getT2(),
            tuple.getT3()
        ));
    }
}
```

## Next Steps

- Add authentication (Spring Security)
- Add API Gateway integration
- Add caching (Spring Cache)
- Add circuit breaker (Resilience4j)
- Configure logging
