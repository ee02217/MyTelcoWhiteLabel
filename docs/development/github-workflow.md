# GitHub Workflow Guide

This document outlines the workflow conventions for contributing to this repository. All work must be tracked in GitHub Issues for proper traceability.

## Creating Issues

### Before Starting Work

1. Search for existing issues that match your task
2. If none exists, create a new issue using the appropriate template
3. For autonomous agent tasks, use the **Agent Task** template

### Issue Template Structure

When creating issues, include:

- **Problem**: What issue needs solving?
- **Goal**: Desired outcome
- **Scope**: What's included/excluded
- **Acceptance Criteria**: How success is measured
- **Technical Notes**: Any constraints or dependencies

## Agent Workflow

### Starting Implementation

1. Identify or create the relevant issue
2. Post a **start comment** on the issue with:
   - Your implementation plan
   - Affected components
   - Timeline estimate

### During Work

Post **progress updates** on the issue:

- Branch name and commit references
- Milestones reached
- Blockers or questions

### Completing Work

1. Open a PR with proper issue reference
2. Comment on the issue with:
   - Implementation summary
   - PR link
   - Files changed
   - Testing performed

## Pull Request Requirements

### Mandatory Issue Reference

Every PR **must** reference an issue in its body. Use one of these formats:

```
Closes #123
```

```
Related to #456
```

The PR enforcement workflow will fail if this is missing.

### PR Template

Use the provided PR template which includes:

- Related Issue (required)
- Summary
- Changes
- Testing
- Notes

## Commit Convention

Use conventional commit format:

```
type(scope): description
```

### Types

| Type       | Description             |
| ---------- | ----------------------- |
| `feat`     | New feature             |
| `fix`      | Bug fix                 |
| `docs`     | Documentation           |
| `style`    | Code style (formatting) |
| `refactor` | Code refactoring        |
| `test`     | Tests                   |
| `chore`    | Maintenance             |

### Examples

```
feat(billing): implement bill summary endpoint
fix(auth): resolve token refresh issue
chore(ci): add issue enforcement workflow
docs(readme): update installation instructions
refactor(api): simplify error handling
```

### Referencing Issues in Commits

Add issue references in commit messages:

```
feat(api): add user profile endpoint

Refs #42
```

This enables the issue activity logger to track work progress.

## Workflow Summary

```
Issue Created → Agent Comments (Start) → Development → Agent Comments (Progress) → PR Opened → Issue Commented (Complete)
```

## Enforcement

- **PRs without issue references** will fail the `PR Issue Enforcement` workflow
- **Issue activity** is automatically logged when commits/PRs reference issues
- **All work** should be traceable back to an issue
