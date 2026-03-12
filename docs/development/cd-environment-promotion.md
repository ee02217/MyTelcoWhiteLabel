# CD Environment Promotion Pipeline

This document describes the continuous deployment (CD) pipeline for environment promotion: development → staging → production.

## Overview

The CD pipeline automates deployments across three environments:

| Environment | Purpose | Approval Required | Auto-Deploy |
|-------------|---------|-------------------|-------------|
| Development | Feature development, integration testing | No | On push to main |
| Staging | Pre-production validation, rollback testing | No | On push to main |
| Production | Live production environment | Yes (manual) | On approval |

## Pipeline Flow

```
┌─────────────┐    ┌─────────────┐    ┌──────────────────────┐    ┌─────────────┐
│   Deploy    │───▶│  Promote    │───▶│ Stage Rollback Test  │───▶│  Production │
│ Development │    │  Staging    │    │                      │    │  Approval   │
└─────────────┘    └─────────────┘    └──────────────────────┘    └─────────────┘
                                                                              │
                                                                              ▼
                                                                       ┌─────────────┐
                                                                       │   Deploy    │
                                                                       │ Production  │
                                                                       └─────────────┘
```

## Workflow File

Location: `.github/workflows/cd-environment-promotion.yml`

### Triggers

1. **Push to main**: Automatically triggers for changes to:
   - `infra/**`
   - `backend-services/**`
   - `bff/**`
   - `.github/workflows/cd-environment-promotion.yml`

2. **Manual dispatch**: Allows manual execution with options:
   - `source_environment`: Choose source for promotion
   - `skip_tests`: Skip rollback tests (not recommended)
   - `dry_run`: Test deployment without actual changes

### Jobs

#### 1. Deploy Development (`deploy-dev`)
- Deploys backend-services and BFF to `telco-dev` namespace
- Uses `infra/helm/environments/dev/` values files
- Skips if Kubernetes credentials are missing (with warning)

#### 2. Promote to Staging (`promote-stage`)
- Depends on: `deploy-dev`
- Deploys to `telco-staging` namespace
- Uses `infra/helm/environments/staging/` values files

#### 3. Stage Rollback Test (`stage-rollback-test`)
- Depends on: `promote-stage`
- Executes `scripts/stage-rollback-test.sh`
- Validates rollback capability:
  - Tests Helm rollback dry-run for both releases
  - Checks release history
  - Verifies namespace accessibility

#### 4. Production Approval (`production-approval`)
- Depends on: `stage-rollback-test`
- Uses GitHub Environment protection
- **Manual approval required** before production deployment
- Environment: `production`

#### 5. Deploy Production (`deploy-prod`)
- Depends on: `production-approval`
- Only executes after approval gate passes
- Deploys to `telco-prod` namespace
- Uses `infra/helm/environments/production/` values files
- Uses Helm atomic flags for automatic rollback on failure

## Manual Approval Mechanism

The production deployment requires manual approval through GitHub Environments:

1. **Environment Protection**: The `production` environment is protected
2. **Required Reviewers**: Configure in GitHub repository settings
3. **Approval Flow**:
   - Pipeline reaches `production-approval` job and pauses
   - Designated approvers review in GitHub UI
   - Once approved, pipeline continues to `deploy-prod`

### Configuring Required Reviewers

1. Go to Repository Settings → Environments
2. Select `production` environment
3. Enable "Required reviewers"
4. Add required approvers (users or teams)

## Rollback Test Procedure

Location: `scripts/stage-rollback-test.sh`

### What It Tests

1. **Cluster Credentials**: Validates kubectl can connect to the cluster
2. **Namespace Accessibility**: Checks the staging namespace exists
3. **Release History**: Verifies multiple revisions are available
4. **Rollback Capability**: Performs Helm rollback dry-run for:
   - backend-services
   - BFF

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Rollback test passed |
| 1 | Rollback test failed |
| 2 | Configuration error |

### Running Manually

```bash
# Set namespace (optional, defaults to telco-staging)
export NAMESPACE=telco-staging

# Set kubeconfig (optional, defaults to ~/.kube/config)
export KUBECONFIG=/path/to/kubeconfig

# Run the test
./scripts/stage-rollback-test.sh
```

## Helm Environment Structure

Location: `infra/helm/environments/`

```
infra/helm/environments/
├── dev/
│   ├── backend-services-values.yaml
│   └── bff-values.yaml
├── staging/
│   ├── backend-services-values.yaml
│   └── bff-values.yaml
└── production/
    ├── backend-services-values.yaml
    └── bff-values.yaml
```

### Environment Differences

| Setting | Dev | Staging | Production |
|---------|-----|---------|------------|
| Replica Count | 1 | 2 | 3 |
| Auto-scaling | Disabled | Enabled (2-4) | Enabled (3-10) |
| Image Tag | latest | staging | prod |
| Resources | 512Mi | 1Gi | 2Gi |
| Pod Disruption | None | None | Min 2 available |
| Redis Cache | Memory | Redis | Redis (SSL) |

## Required Secrets and Variables

### GitHub Secrets

| Secret | Description | Required For |
|--------|-------------|--------------|
| `KUBECONFIG_DEV` | Kubeconfig for dev cluster | deploy-dev |
| `KUBECONFIG_STAGING` | Kubeconfig for staging cluster | promote-stage, stage-rollback-test |
| `KUBECONFIG_PROD` | Kubeconfig for production cluster | deploy-prod |

### GitHub Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `HELM_VERSION` | Helm CLI version | 3.14.0 |
| `KUBECTL_VERSION` | kubectl CLI version | 1.28.0 |

### Kubernetes Resources

Ensure the following exist in each cluster:

1. **Namespace**: `telco-dev`, `telco-staging`, `telco-prod`
2. **Ingress Controller**: nginx-ingress
3. **Cert Manager**: For TLS certificates
4. **Redis** (staging/prod): For caching
5. **Database**: Environment-specific connection details

## Triggering Deployments

### Automatic (Push to Main)

```bash
# Make changes and push to main
git checkout main
git merge feat/your-feature
git push origin main
```

### Manual (Workflow Dispatch)

1. Go to Actions → CD - Environment Promotion
2. Click "Run workflow"
3. Select options (or use defaults)
4. Click "Run workflow"

## Troubleshooting

### Deployment Skipped with Warning

If you see "Kubernetes credentials missing", ensure the appropriate `KUBECONFIG` secret is set.

### Rollback Test Fails

1. Check cluster connectivity
2. Verify namespace exists
3. Ensure Helm releases are deployed
4. Check release history has multiple revisions

### Production Approval Not Working

1. Verify GitHub Environment is configured
2. Check required reviewers are set
3. Ensure approvers have repository access

## Security Considerations

1. **Least Privilege**: Use IAM roles with minimal permissions
2. **Secret Rotation**: Regularly rotate kubeconfig credentials
3. **Approval Auditing**: All approvals are logged in GitHub
4. **Network Policies**: Implement Kubernetes network policies
5. **Pod Security**: Use Pod Security Standards

## Related Documentation

- [GitHub Workflow Documentation](./github-workflow.md)
- [CI Pipeline](./ci.md)
- [Backend Services Helm Chart](../../backend-services/helm/)
- [BFF Helm Chart](../../bff/helm/)
