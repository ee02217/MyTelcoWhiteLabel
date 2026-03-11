# Backend Service

Spring Boot backend service template for the Telco Self-Care White-Label Platform.

## Tech Stack

- **Framework:** Spring Boot 3.3.0
- **Language:** Java 21
- **Build Tool:** Maven

## Getting Started

### Prerequisites

| Tool     | Version |
| -------- | ------- |
| Java JDK | ≥21     |
| Maven    | ≥3.8    |

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
docker build -t mytelco/backend-service:latest .

# Run Docker container
docker run -p 8080:8080 mytelco/backend-service:latest
```

### Helm Deployment

```bash
# Add Helm repository (if applicable)
helm repo add mytelco https://mytelco.github.io/helm-charts

# Deploy to Kubernetes
helm install backend-service ./helm \
  --set image.repository=mytelco/backend-service \
  --set image.tag=latest
```

## Project Structure

```
backend-service/
├── src/
│   ├── main/
│   │   ├── java/com/mytelco/
│   │   │   ├── BackendServiceApplication.java
│   │   │   └── controller/
│   │   │       └── SampleController.java
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

| Endpoint   | Path                         | Description                |
| ---------- | ---------------------------- | -------------------------- |
| Health     | `/actuator/health`           | Overall health status      |
| Liveness   | `/actuator/health/liveness`  | Kubernetes liveness probe  |
| Readiness  | `/actuator/health/readiness` | Kubernetes readiness probe |
| Info       | `/actuator/info`             | Application information    |
| Metrics    | `/actuator/metrics`          | Application metrics        |
| Prometheus | `/actuator/prometheus`       | Prometheus metrics export  |

## Creating a New Service from Template

1. **Copy the template:**

   ```bash
   cp -r backend-services backend-my-service
   ```

2. **Update package structure:**
   - Rename `com/mytelco` to `com/mytelco/my-service`
   - Update package declarations in Java files

3. **Update configuration:**
   - Edit `pom.xml` - change artifactId and app name
   - Edit `application.yml` - set service port and name

4. **Update Helm chart:**
   - Edit `helm/Chart.yaml` - update name and description
   - Edit `helm/values.yaml` - set image repository

5. **Build and test:**
   ```bash
   mvn clean package
   mvn spring-boot:run
   ```

## Configuration

### Environment Variables

| Variable                 | Description    | Default |
| ------------------------ | -------------- | ------- |
| `SERVER_PORT`            | HTTP port      | 8080    |
| `SPRING_PROFILES_ACTIVE` | Spring profile | dev     |

### Application Properties

Key properties in `application.yml`:

- `server.port` - HTTP listener port
- `spring.application.name` - Application name
- `management.endpoints.web.exposure.include` - Exposed actuator endpoints

## API Endpoints

Sample endpoints (replace with actual business logic):

| Method | Path             | Description          |
| ------ | ---------------- | -------------------- |
| GET    | `/api/v1/health` | Service health check |
| GET    | `/api/v1/info`   | Service information  |

## Next Steps

- Add database connectivity (Spring Data JPA)
- Add security (Spring Security)
- Add API documentation (SpringDoc OpenAPI)
- Configure logging
- Add business logic controllers
