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
| `mobile-app/` | Mobile application (React Native/Flutter) |
| `web-portal/` | Customer-facing web portal |
| `backend-services/` | Core backend services |
| `bff/` | Backend-for-Frontend services |
| `integration-layer/` | Integration/ESB layer |
| `admin-portal/` | Admin management portal |
| `platform-config/` | Shared configuration & utilities |
| `infra/` | Infrastructure as Code |

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
