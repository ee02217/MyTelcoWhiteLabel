# Design System

## Shared token source

Canonical tokens live in `platform-config/design-system/`:

- `tokens.json` — source of truth with categories `color`, `typography`, `spacing`, `radius`, `shadow`, `motion`
- `tokens.css` — CSS custom properties consumed by web/admin portals
- `tokens.ts` — typed exports plus React Native-friendly `rnTokens`

## Component libraries

- `web-portal/src/design-system/`: `Button`, `Card`, `Typography`, `DesignSystemProvider`
- `admin-portal/src/design-system/`: same primitives for admin UI
- `mobile-app/src/design-system/`: React Native `Button`, `Card`, `Typography`

Each app entry screen includes a small design-system demo so token changes are visible in local runs.

## Accessibility contrast checks

`node scripts/check-design-contrast.mjs` validates WCAG contrast ratios for semantic text/background pairs and button text/background pairs.

The `development-standards` workflow executes this script in CI (`Design System Standards` job), so PRs fail when contrast constraints are violated.

## Local developer commands

```bash
node scripts/check-design-contrast.mjs
npx prettier --check .
cd web-portal && npm run typecheck
cd admin-portal && npm run typecheck
cd mobile-app && npm run typecheck
```
