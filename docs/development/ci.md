# CI/CD Pipeline Documentation

## Overview

This document describes the GitHub Actions CI/CD pipelines for the Telco Self-Care White-Label Platform.

## Pipeline Architecture

### Pull Request Pipeline (`ci-pr.yml`)

Triggered on: `pull_request` to `main` branch

**Jobs:**

| Job                 | Description                                | Quality Gate               |
| ------------------- | ------------------------------------------ | -------------------------- |
| `lint`              | Runs linting on changed Node.js modules    | ❌ Blocks merge on failure |
| `test-node`         | Runs unit tests on changed Node.js modules | ❌ Blocks merge on failure |
| `test-java-backend` | Builds & tests backend-services (Java)     | ❌ Blocks merge on failure |
| `test-java-bff`     | Builds & tests BFF (Java)                  | ❌ Blocks merge on failure |
| `sca-scan`          | Security vulnerability scanning            | ❌ Blocks merge on CVSS ≥7 |
| `build-docker`      | Validates Docker images build              | ❌ Blocks merge on failure |

**Changed-Module Strategy:**

The pipeline uses `scripts/run-changed.mjs` to detect which modules were modified in the PR and only runs lint/test for affected modules. This optimizes CI runtime.

**Modules:**

- `admin-portal` (Node.js)
- `web-portal` (Node.js)
- `mobile-app` (Node.js)
- `integration-layer` (Node.js)
- `platform-config` (Node.js)
- `backend-services` (Java/Maven)
- `bff` (Java/Maven)

**SCA Scanning:**

- **Node.js**: `npm audit` (audit-level: moderate)
- **Java**: OWASP Dependency Check Maven (fail on CVSS ≥7)

### Main Branch Pipeline (`ci-main-image-build.yml`)

Triggered on: `push` to `main` branch (when `backend-services/`, `bff/`, or workflow files change)

**Jobs:**

| Job             | Description                                   | Outputs        |
| --------------- | --------------------------------------------- | -------------- |
| `build-backend` | Builds & pushes backend-services Docker image | Versioned tags |
| `build-bff`     | Builds & pushes BFF Docker image              | Versioned tags |

**Image Tagging Strategy:**

| Tag                      | Description           | Example            |
| ------------------------ | --------------------- | ------------------ |
| `latest`                 | Latest commit on main | `latest`           |
| `sha-<short-sha>`        | SHA-based tag         | `sha-abc1234`      |
| `<YYYYMMDD>-<short-sha>` | Date + SHA            | `20260311-abc1234` |

**Registry:**

- Images are pushed to GitHub Container Registry (ghcr.io)
- Format: `ghcr.io/ee02217/mytelcowhitelabel/<service>:<tag>`

**Conditional Push:**

- If registry secrets are not configured, push is skipped but build is still validated
- This ensures Dockerfile changes are validated even without registry access

## Quality Gates

### Merge Blocking Conditions

1. **Lint failures** - Code style violations
2. **Test failures** - Unit tests must pass
3. **SCA vulnerabilities** - CVSS score ≥ 7 blocks merge
4. **Docker build failures** - Images must build successfully

### Required Status Checks

All jobs in the PR pipeline must pass before a PR can be merged (via branch protection rules).

## Running Locally

### Prerequisites

- Node.js 20+
- Java 17+
- Maven 3.8+
- Docker (for image building)

### Local Validation Commands

```bash
# Install dependencies
npm ci

# Lint
npm run lint:changed    # Changed modules only
npm run lint:all        # All modules

# Test
npm run test:changed    # Changed modules only
npm run test:all        # All modules

# Build
npm run build:changed   # Changed modules only
npm run build:all       # All modules

# Java modules
cd backend-services
mvn clean verify

cd ../bff
mvn clean verify
```

## Troubleshooting

### Common Issues

**"No changes detected" in lint/test jobs:**

- Ensure `fetch-depth: 0` is set to fetch full git history
- Check that module paths match the `run-changed.mjs` logic

**SCA scan fails with CVSS ≥ 7:**

- Review the vulnerability report
- Update the dependency to a secure version
- If false positive, add to `dependency-check-suppressions.xml`

**Docker build fails:**

- Check Dockerfile syntax
- Verify base images are accessible
- Review build logs for specific errors

## Security Considerations

1. **No secrets in workflows** - Use GitHub secrets for sensitive data
2. **Container scanning** - OWASP Dependency-Check scans for known CVEs
3. **Minimal base images** - Use slim JDK/JRE images to reduce attack surface
4. **Read-only filesystem** - Run containers with read-only filesystem where possible
