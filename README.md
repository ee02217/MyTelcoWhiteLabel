# MyTelcoWhiteLabel

Telco Self-Care White-Label Platform - Mono-repo for multi-operator telco services.

## Overview

This is the main repository for the Telco Self-Care White-Label Platform, supporting TMF-friendly integration and cloud-native architecture.

## Quick Links

- **[Developer Onboarding](./docs/development/onboarding.md)** - Get started in under 60 minutes
- **[GitHub Workflow](./docs/development/github-workflow.md)** - Development workflow guide

## Module Structure

| Module | Description |
|--------|-------------|
| `mobile-app/` | Mobile application (React Native + Expo) |
| `web-portal/` | Customer-facing web portal (Vite + React + TypeScript) |
| `admin-portal/` | Admin management portal (Vite + React + TypeScript) |
| `backend-services/` | Core backend services (Spring Boot + Java 21) |
| `bff/` | Backend-for-Frontend services (Spring Boot + WebFlux) |
| `integration-layer/` | Integration/ESB layer |
| `platform-config/` | Shared configuration & design tokens |
| `infra/` | Infrastructure as Code |

## Base Templates

This repository includes base templates for quick project bootstrapping. See [Developer Onboarding](./docs/development/onboarding.md#base-templates-issue-20) for details.

| Template | Tech Stack | Key Files |
|----------|------------|------------|
| `mobile-app/` | React Native + Expo | package.json, App.tsx, app.json |
| `web-portal/` | Vite + React + TypeScript | package.json, vite.config.ts, src/App.tsx |
| `admin-portal/` | Vite + React + TypeScript | package.json, vite.config.ts, src/App.tsx |
| `backend-services/` | Spring Boot + Java 21 | pom.xml, Dockerfile, helm/ |
| `bff/` | Spring Boot + WebFlux | pom.xml, Dockerfile, helm/ |
| `platform-config/design-tokens/` | Shared tokens | tokens.json, tokens.css |

## Commands

### Changed-Module Commands

Run lint/test/build only on modules that have changed:

```bash
npm run lint:changed   # Lint changed modules
npm run test:changed   # Test changed modules  
npm run build:changed  # Build changed modules
```

Options:
- `--base <ref>` - Compare against specific ref (default: origin/main)
- `--all` - Run on all modules regardless of changes

### Other Commands

```bash
npm run repo:verify     # Verify repository structure
npm run lint:all       # Lint all modules
npm run test:all       # Test all modules
npm run build:all      # Build all modules
```

## Getting Started

See [Developer Onboarding](./docs/development/onboarding.md) for detailed setup instructions.

## License

UNLICENSED
