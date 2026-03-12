# Container/Orchestration Baseline

This document describes the container and Kubernetes baseline for the Telco Self-Care Platform.

## Overview

The platform uses containerization (Docker) and orchestration (Kubernetes) to ensure portability across operators and clouds. This baseline provides standardized manifests for all deployable runtime services.

## Service Coverage

| Service           | Type         | Container | Port | Runtime | K8s Runtime   |
| ----------------- | ------------ | --------- | ---- | ------- | ------------- |
| backend-services  | Spring Boot  | ✅        | 8080 | JVM     | ✅            |
| bff               | Spring Boot  | ✅        | 8081 | JVM     | ✅            |
| web-portal        | React SPA    | ✅        | 80   | nginx   | ✅            |
| admin-portal      | React SPA    | ✅        | 80   | nginx   | ✅            |
| integration-layer | TBD          | ❌        | -    | -       | ❌ (deferred) |
| mobile-app        | React Native | N/A       | -    | client  | ❌            |

### Mobile App Exclusion

The **mobile-app** is explicitly excluded from Kubernetes runtime because:

1. **Client-side execution**: Mobile apps run on end-user devices (iOS/Android), not on server infrastructure
2. **Different distribution**: Deployed via App Store/Play Store, not container registries
3. **No server component**: The mobile app communicates with the BFF via REST/gRPC APIs

### Integration Layer Deferred

The **integration-layer** (ESB/API Gateway) is deferred to a future issue because:

- Not yet an executable service template
- Requires architectural decisions on implementation (e.g., Kong, Apigee, custom)
- Will be addressed in a follow-up feature issue

## Docker Images

### Build Commands

```bash
# Backend Services
docker build -t ee02217/mytelco-backend-services:latest ./backend-services

# BFF
docker build -t ee02217/mytelco-bff:latest ./bff

# Web Portal
docker build -t ee02217/mytelco-web-portal:latest ./web-portal

# Admin Portal
docker build -t ee02217/mytelco-admin-portal:latest ./admin-portal
```

### Image Naming Convention

Images follow the pattern: `ee02217/mytelco-<service>:latest`

For production, use semantic versioning: `ee02217/mytelco-backend-services:v1.0.0`

## Kubernetes Architecture

### Directory Structure

```
infra/k8s/
└── base/
    ├── kustomization.yaml
    ├── backend-services/
    │   ├── deployment.yaml
    │   └── service.yaml
    ├── bff/
    │   ├── deployment.yaml
    │   └── service.yaml
    ├── web-portal/
    │   ├── deployment.yaml
    │   └── service.yaml
    └── admin-portal/
        ├── deployment.yaml
        └── service.yaml
```

### Health Probes

#### Spring Boot Services (backend-services, bff)

Uses Spring Boot Actuator for liveness and readiness probes:

- **Liveness**: `/actuator/health/liveness` - Indicates if the JVM is alive
- **Readiness**: `/actuator/health/readiness` - Indicates if the service can handle requests

Configuration (application.yml):

```yaml
management:
  endpoint:
    health:
      show-details: always
  health:
    livenessState:
      enabled: true
    readinessState:
      enabled: true
```

#### Nginx Services (web-portal, admin-portal)

Uses simple HTTP health check on `/health`:

- **Liveness**: HTTP GET `/health` - Basic nginx response check
- **Readiness**: HTTP GET `/health` - Same as liveness for static content

### Resource Requests and Limits

| Service          | Requests    | Limits      | Rationale                              |
| ---------------- | ----------- | ----------- | -------------------------------------- |
| backend-services | 512Mi, 250m | 1Gi, 500m   | JVM heap + overhead for business logic |
| bff              | 384Mi, 200m | 768Mi, 400m | Lightweight BFF, proxies to backend    |
| web-portal       | 64Mi, 50m   | 128Mi, 100m | Static content, minimal memory         |
| admin-portal     | 64Mi, 50m   | 128Mi, 100m | Static content, minimal memory         |

**Rationale:**

- Backend services have higher resource needs due to JVM overhead
- BFF is lighter as it primarily proxies requests
- Frontend services are nginx serving static files

## Deployment Examples

### Apply All Services

```bash
# Using kustomize
kubectl apply -k infra/k8s/base/

# Or apply individual services
kubectl apply -f infra/k8s/base/backend-services/
kubectl apply -f infra/k8s/base/bff/
kubectl apply -f infra/k8s/base/web-portal/
kubectl apply -f infra/k8s/base/admin-portal/
```

### Verify Deployment

```bash
# Check pods
kubectl get pods -l platform=mytelco-white-label

# Check services
kubectl get svc -l platform=mytelco-white-label

# Check pod health
kubectl get pods -l app=backend-services -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].status}'

# View pod logs
kubectl logs -l app=backend-services -f
```

### Scale Services

```bash
# Scale backend services
kubectl scale deployment backend-services --replicas=5

# Scale BFF
kubectl scale deployment bff --replicas=3
```

### Access Services (port-forward for local dev)

```bash
# Web portal
kubectl port-forward svc/web-portal 8080:80

# Admin portal
kubectl port-forward svc/admin-portal 8081:80

# BFF API
kubectl port-forward svc/bff 8082:8081
```

## Security Considerations

- All containers run as non-root user (UID 1000)
- Read-only root filesystems recommended for production
- Use secrets for sensitive configuration
- Enable network policies for inter-service communication
- Regular image scanning for vulnerabilities

## Future Enhancements

- Environment overlays (dev/staging/prod) via kustomize
- Horizontal Pod Autoscaler (HPA) configuration
- Ingress for external access
- Service mesh (Istio/Linkerd) for advanced traffic management
- Pod disruption budgets for graceful rollouts

## Related Documentation

- [GitHub Workflow](./github-workflow.md) - CI/CD pipeline for container builds
- [CD Environment Promotion](./cd-environment-promotion.md) - Promotion strategy across environments
