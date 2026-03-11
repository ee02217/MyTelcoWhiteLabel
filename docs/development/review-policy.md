# Development Review Policy

## Overview

This document outlines the code review workflow and branch protection expectations for the MyTelco White-Label Platform.

## Branch Protection

All pull requests must meet the following requirements before merging:

### Required Checks

- **CI Pipeline Pass:** All workflows in `.github/workflows/` must pass
- **Development Standards:** Code style checks (Prettier, ESLint, Spotless) must pass
- **Tests:** All automated tests must pass

### Review Requirements

- At least **1 reviewer** must approve the PR
- All **review comments** must be resolved
- **No merge conflicts** with the target branch

## Code Review Process

### 1. Creating a Pull Request

1. Ensure all changes are committed on a feature branch
2. Push branch and open PR against `main` (or `develop` for development)
3. Fill out the PR template completely
4. Link the issue using "Closes #<number>" or "Related to #<number>"

### 2. Review Process

1. Assign reviewers (see CODEOWNERS for domain expertise)
2. Address feedback and make changes
3. Re-request review after updates
4. Ensure all CI checks pass

### 3. Merging

- **Squash merge** preferred for clean history
- **Merge commit** acceptable for multi-commit feature branches
- **Rebase** for updating against main branch before merge

## Pre-commit & Local Development

### Pre-commit Hooks

The project uses Husky for pre-commit hooks. Before pushing:

```bash
# Install dependencies (includes husky setup)
npm install

# Verify pre-commit setup
npm run prepare
```

Pre-commit checks include:

- Prettier formatting
- ESLint linting

### Running Checks Locally

```bash
# Check formatting
npm run lint:all

# Run tests
npm run test:all

# Build all modules
npm run build:all

# Java code style (from project root)
cd backend-services && mvn spotless:check
cd bff && mvn spotless:check
```

## Code Owners

See `.github/CODEOWNERS` for domain-specific ownership. Code owners are automatically requested for review when files in their domain are changed.

## Standards Enforcement

### Java Code Style

- **Backend Services:** Uses Checkstyle with Google Java Style
- **BFF Service:** Uses Checkstyle with Google Java Style
- Run `mvn checkstyle:check` to verify (or `mvn checkstyle:checkstyle` for detailed report)

### JavaScript/TypeScript Code Style

- **Formatting:** Prettier (see `.prettierrc`)
- **Linting:** ESLint (per module configuration)
- Run `npx prettier --write .` to auto-fix formatting

## Questions?

Contact the repository maintainers or open a discussion in the repository.
