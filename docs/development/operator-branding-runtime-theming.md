# Operator Branding & Runtime Theming

This document describes the operator branding system that enables white-label customization without requiring application redeployment.

## Overview

The platform supports multiple operators (tenants) with distinct branding while sharing the same codebase. Branding configuration is centralized in `platform-config` and loaded at runtime.

## Configuration Model

### Directory Structure

```
platform-config/
└── operators/
    ├── schema/
    │   └── branding.schema.json      # JSON Schema for validation
    ├── default/
    │   └── branding/
    │       └── config.json           # Default branding (fallback)
    └── alpha-telecom/
        └── branding/
            └── config.json           # Alpha Telecom branding
```

### Configuration Schema

Each operator's `config.json` contains:

| Field            | Type   | Description                                       |
| ---------------- | ------ | ------------------------------------------------- |
| `operatorId`     | string | Unique identifier (kebab-case)                    |
| `name`           | string | Display name                                      |
| `logo`           | object | Logo URLs for light/dark modes                    |
| `colors`         | object | Color palettes (primary, secondary, accent, etc.) |
| `typography`     | object | Font families and heading styles                  |
| `semanticTokens` | object | Mapping to semantic tokens                        |
| `cssVariables`   | object | Custom CSS custom properties                      |
| `version`        | string | Config version                                    |
| `lastUpdated`    | string | ISO 8601 timestamp                                |

### Color Palettes

Colors follow Tailwind CSS conventions with 10 shades (50-900):

```json
{
  "primary": {
    "50": "#e6f2ff",
    "100": "#b3d9ff",
    "500": "#0073e6",
    "900": "#000d1a"
  }
}
```

## Runtime Resolution Order

Theme resolution follows this priority chain:

1. **Query Parameter**: `?operatorId=alpha-telecom`
2. **HTTP Header**: `X-Operator-ID: alpha-telecom`
3. **Environment Variable**: `VITE_OPERATOR_ID` (web) / `OPERATOR_ID` (mobile)
4. **Local Storage**: `operatorId` key
5. **Fallback**: `default` operator

### Web Applications (Admin Portal / Web Portal)

```typescript
import { initializeTheme, getOperatorId } from './services/theme-loader';

// Initialize early in app startup
const branding = await initializeTheme();

// Manual operator switch
setOperatorId('alpha-telecom');
```

### Mobile Application

```typescript
import { useOperatorTheme } from './hooks/useOperatorTheme';

function App() {
  const { operatorId, branding, primaryColor, setOperatorId } = useOperatorTheme();

  // ...
}
```

## Update Workflow (No Redeploy)

### Making Branding Changes

1. **Edit the configuration file**:

   ```bash
   vim platform-config/operators/alpha-telecom/branding/config.json
   ```

2. **Validate the configuration**:

   ```bash
   node scripts/validate-branding-config.mjs
   ```

3. **Commit and push** changes to the repository.

4. **Deploy updated config** (configuration deployment):
   - For containerized apps: Rebuild the BFF with updated resources
   - For static serving: Deploy to CDN/static file storage
   - **Alternative (recommended)**: Mount config as volume or use config map

### Zero-Downtime Updates (Recommended)

For true no-redeploy updates:

1. **Use external config storage** (e.g., AWS S3, Consul, etcd)
2. **Update the external config** directly
3. **Clients fetch fresh config** on next request (cache headers control freshness)

## Cache Invalidation Strategy

### Client-Side Caching

| Layer           | TTL           | Invalidation                   |
| --------------- | ------------- | ------------------------------ |
| In-memory cache | Session       | Page refresh                   |
| localStorage    | 24 hours      | Explicit clear or version bump |
| API response    | Cache-Control | `no-cache` header              |

### Cache Control Headers

The BFF should serve branding with appropriate headers:

```
Cache-Control: public, max-age=3600, stale-while-revalidate=86400
ETag: "config-version-hash"
```

### Force Refresh

```typescript
// Clear local cache and reload
import { clearBrandingCache, loadAndApplyBranding } from './services/theme-loader';

clearBrandingCache();
await loadAndApplyBranding();
```

## API Endpoints

### GET /api/v1/theme/{operatorId}

Returns branding configuration for the specified operator.

**Response:**

```json
{
  "operatorId": "alpha-telecom",
  "name": "Alpha Telecom",
  "logo": {
    "light": "/assets/branding/alpha-telecom/logo-light.svg",
    "dark": "/assets/branding/alpha-telecom/logo-dark.svg"
  },
  "colors": { ... },
  "typography": { ... },
  "semanticTokens": { ... }
}
```

### GET /api/v1/theme

Returns list of available operator IDs.

## Validation

Run the validation script before committing:

```bash
node scripts/validate-branding-config.mjs
```

This validates:

- Required fields present
- Color format (#RRGGBB)
- JSON syntax

## Adding a New Operator

1. Create directory: `platform-config/operators/<new-operator-id>/branding/`
2. Copy `config.json` from `default` operator
3. Modify colors, typography, and logo URLs
4. Run validation: `node scripts/validate-branding-config.mjs`
5. Copy to BFF resources: `bff/admin-bff/src/main/resources/operators/`
6. Commit and deploy

## CSS Variables Applied

The theme loader applies these CSS custom properties to `:root`:

```css
/* Colors */
--color-primary-50 through --color-primary-900
--color-secondary-50 through --color-secondary-900
--color-accent-50 through --color-accent-900

/* Typography */
--font-sans
--font-mono

/* Semantic */
--text-primary
--text-secondary
--background-primary
--background-secondary
--border-default
--border-focus

/* Custom */
--border-radius-sm
--shadow-md
/* ... any custom variables from config */
```

## Security Considerations

- Operator IDs are validated against `[a-z0-9-]+` pattern
- Only pre-configured operators can be used
- No arbitrary file access (config must exist in approved list)
