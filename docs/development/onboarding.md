# Developer Onboarding Guide

Welcome to the Telco Self-Care White-Label Platform! This guide will help you get started with development in under 60 minutes.

## Prerequisites

### Required Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | ≥18.x | JavaScript runtime |
| npm | ≥9.x | Package manager |
| Git | ≥2.30 | Version control |
| Docker | ≥20.x | Container runtime (for local services) |

### Optional Tools

| Tool | Purpose |
|------|---------|
| Java JDK | ≥17 | For Java backend modules |
| Maven | ≥3.8 | For Java module builds |
| Terraform | ≥1.0 | For infrastructure as code |

## Quick Start (30 minutes)

### 1. Clone the Repository

```bash
git clone https://github.com/ee02217/MyTelcoWhiteLabel.git
cd MyTelcoWhiteLabel
```

### 2. Install Dependencies

```bash
# Root-level dependencies (for changed-module scripts)
npm install

# For a specific module
cd mobile-app
npm install
cd ..
```

### 3. Verify Repository Structure

```bash
npm run repo:verify
```

### 4. Run Changed-Module Commands

The repository includes smart commands that detect which modules have changed and only run operations on those:

```bash
# Lint changed modules (vs origin/main)
npm run lint:changed

# Test changed modules
npm run test:changed

# Build changed modules
npm run build:changed

# Run on all modules (ignoring changes)
npm run lint:all
npm run test:all
npm run build:all

# Custom base ref
npm run lint:changed -- --base HEAD~5
```

### 5. Start Development

Once you've identified which module you need to work on:

```bash
# Example: Starting the web portal
cd web-portal
npm install
npm run dev  # or appropriate start command
```

## Repository Structure

```
MyTelcoWhiteLabel/
├── mobile-app/          # Mobile application (React Native/Flutter)
├── web-portal/          # Customer-facing web portal
├── backend-services/    # Core backend services
├── bff/                 # Backend-for-Frontend services
├── integration-layer/   # Integration/ESB layer
├── admin-portal/        # Admin management portal
├── platform-config/    # Shared configuration & utilities
├── infra/              # Infrastructure as Code
├── docs/               # Documentation
│   └── development/    # Developer guides
├── scripts/            # Build & automation scripts
│   └── run-changed.mjs # Changed-module command runner
├── package.json        # Root package configuration
└── README.md          # Project overview
```

## Changed-Module Commands

### How It Works

The `scripts/run-changed.mjs` script:
1. Compares the current branch against a base ref (default: `origin/main`)
2. Detects which top-level modules have changes
3. Runs the requested command (lint/test/build) on each changed module
4. Supports both Node.js (package.json) and Java (pom.xml) modules

### Command Mapping

| Root Command | Node.js Module | Java Module |
|--------------|----------------|-------------|
| `lint:changed` | `npm run lint` | `mvn verify -DskipTests` |
| `test:changed` | `npm run test` | `mvn verify -DskipTests` |
| `build:changed` | `npm run build` | `mvn package -DskipTests` |

### Examples

```bash
# See which modules have changed
git diff --name-only origin/main

# Lint only the modules you changed
npm run lint:changed

# Test with custom base (e.g., last 5 commits)
npm run test:changed -- --base HEAD~5

# Build all modules regardless of changes
npm run build:changed -- --all

# Run specific module directly
cd web-portal && npm run lint
```

## Module Guidelines

### Adding a New Module

1. Create a top-level folder following the naming convention
2. Add a `README.md` explaining the module purpose
3. Add either:
   - `package.json` for Node.js modules
   - `pom.xml` for Java modules
4. The changed-module commands will automatically detect and run on it

### Module README Template

```markdown
# [Module Name]

Brief description of the module's purpose.

## Structure
- Key directories and their contents

## Available Commands
- `npm run lint` - Lint code
- `npm run test` - Run tests
- `npm run build` - Build the module
```

## Base Templates (Issue #20)

This repository includes base templates for quick project bootstrapping:

### Mobile App (React Native + Expo)

```bash
cd mobile-app
npm install
npm run start
```

Quick commands:
- `npm run start` - Start Expo dev server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run typecheck` - Type check with TypeScript

See [mobile-app/README.md](../mobile-app/README.md) for details.

### Web Portal & Admin Portal (Vite + React + TypeScript)

Both portals share design tokens from `platform-config/design-tokens/`.

**Web Portal:**
```bash
cd web-portal
npm install
npm run dev
```

**Admin Portal:**
```bash
cd admin-portal
npm install
npm run dev
```

Quick commands:
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run typecheck` - Type check with TypeScript

See respective READMEs for details.

### Backend Services (Spring Boot + Java 21)

**Backend Service:**
```bash
cd backend-services
mvn clean package
mvn spring-boot:run
```

**BFF Service:**
```bash
cd bff
mvn clean package
mvn spring-boot:run
```

Quick commands:
- `mvn clean package` - Build the application
- `mvn spring-boot:run` - Run locally
- `docker build` - Build Docker image
- `helm install` - Deploy to Kubernetes

Health endpoint: `/actuator/health`

See respective READMEs for details.

### Design Tokens

Shared design tokens in `platform-config/design-tokens/`:
- `tokens.json` - JSON format for programmatic access
- `tokens.css` - CSS custom properties

Import in React apps:
```typescript
import tokens from '@my-telco/design-tokens';
// or
import './index.css'; // imports tokens.css
```

## Troubleshooting

### "No changed modules detected"

This happens when:
- You're on the same commit as base ref
- Changes are only in files not under a module directory

Use `--all` flag to run on all modules.

### "missing script" errors

The module doesn't have the required script in package.json. Add scripts like:
```json
{
  "scripts": {
    "lint": "eslint .",
    "test": "jest",
    "build": "tsc"
  }
}
```

### Java module build failures

Ensure Java 17+ and Maven are installed:
```bash
java -version
mvn -version
```

## Next Steps

- Review the [GitHub Workflow Documentation](./github-workflow.md)
- Check the product backlog for assigned tasks
- Join the team channel for questions

---

For issues or questions, open a GitHub issue or reach out to the team.
