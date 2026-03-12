# Design System

The MyTelco White-Label platform uses a centralized design system with shared tokens, component libraries, and accessibility standards.

## Overview

The design system consists of:

1. **Design Tokens** - Single source of truth for design values (colors, typography, spacing, etc.)
2. **Component Libraries** - Reusable UI components for each portal (web, admin, mobile)
3. **Accessibility Standards** - WCAG contrast validation integrated into CI

## Design Tokens

Located in `platform-config/design-tokens/`:

| File          | Purpose                                        |
| ------------- | ---------------------------------------------- |
| `tokens.json` | Canonical source of truth for all tokens       |
| `tokens.css`  | CSS custom properties for web/admin portals    |
| `tokens.ts`   | TypeScript exports for React Native mobile app |

### Token Categories

#### Colors

- **Primary**: Brand color (blue palette, 50-900 shades)
- **Secondary**: Secondary brand color
- **Semantic**: Success, warning, error states
- **Neutral**: Gray scale for text and backgrounds

#### Typography

- **Font Family**: Sans-serif (Inter) and monospace
- **Font Size**: XS, SM, Base, LG, XL, 2XL, 3XL, 4XL
- **Font Weight**: Normal, Medium, Semibold, Bold

#### Spacing

- Numeric scale from 0 to 16 (multiples of 4px base)

#### Border Radius

- None, SM, Default, MD, LG, XL, Full

#### Shadows

- SM, Default, MD, LG, XL

#### Motion

- **Duration**: Fast (150ms), Normal (300ms), Slow (500ms), Slower (700ms), Slowest (1000ms)
- **Easing**: Linear, Ease, Ease-In, Ease-Out, Ease-In-Out

#### Semantic Colors

- Text: Primary, Secondary, Disabled, Inverse
- Background: Primary, Secondary, Tertiary
- Border: Default, Focus

## Component Libraries

### Web Portal (`web-portal/src/design-system/`)

```typescript
import { Button, Card, Typography, DesignSystemProvider } from './design-system';

function App() {
  return (
    <DesignSystemProvider>
      <Card padding="md" shadow="md">
        <Typography variant="h2">Welcome</Typography>
        <Button variant="primary" size="md">Get Started</Button>
      </Card>
    </DesignSystemProvider>
  );
}
```

#### Button

| Prop    | Type                                             | Default   | Description  |
| ------- | ------------------------------------------------ | --------- | ------------ |
| variant | 'primary' \| 'secondary' \| 'outline' \| 'ghost' | 'primary' | Visual style |
| size    | 'sm' \| 'md' \| 'lg'                             | 'md'      | Button size  |

#### Card

| Prop    | Type                           | Default | Description      |
| ------- | ------------------------------ | ------- | ---------------- |
| padding | 'none' \| 'sm' \| 'md' \| 'lg' | 'md'    | Internal spacing |
| shadow  | 'none' \| 'sm' \| 'md' \| 'lg' | 'md'    | Shadow depth     |

#### Typography

| Prop    | Type                                                           | Default   | Description |
| ------- | -------------------------------------------------------------- | --------- | ----------- |
| variant | 'h1' \| 'h2' \| 'h3' \| 'h4' \| 'body' \| 'small' \| 'caption' | 'body'    | Text style  |
| color   | 'primary' \| 'secondary' \| 'disabled' \| 'inverse'            | 'primary' | Text color  |

### Admin Portal

Same components as web portal, imported from `admin-portal/src/design-system/`

### Mobile App (`mobile-app/src/design-system/`)

React Native equivalents with similar API:

```typescript
import { Button, Card, Typography } from './src/design-system';

function Screen() {
  return (
    <Card padding="md" shadow="md">
      <Typography variant="h2">Welcome</Typography>
      <Button variant="primary" size="md" title="Get Started" />
    </Card>
  );
}
```

## Accessibility

### WCAG Contrast Checks

All design tokens are validated against WCAG 2.1 AA standards:

- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text** (18px+ or 14px+ bold): Minimum 3:1 contrast ratio
- **UI components**: Minimum 3:1 for graphical objects

### Running Contrast Checks

Local development:

```bash
node scripts/check-design-contrast.mjs
```

CI automatically runs contrast checks on every PR via the `development-standards` workflow.

### Current Validated Pairs

| Context        | Foreground | Background | Min Ratio |
| -------------- | ---------- | ---------- | --------- |
| Primary text   | #18181b    | #ffffff    | 4.5:1     |
| Secondary text | #52525b    | #ffffff    | 4.5:1     |
| Primary button | #ffffff    | #0073e6    | 4.5:1     |
| Error text     | #ffffff    | #ef4444    | 4.5:1     |
| Heading text   | #18181b    | #ffffff    | 3.0:1     |
| Inverse text   | #fafafa    | #18181b    | 4.5:1     |

## Integration

### Adding to a New Portal

1. Copy the `design-system/` folder structure
2. Import tokens CSS in your app entry point:
   ```css
   @import '../../../platform-config/design-tokens/tokens.css';
   ```
3. Wrap your app with `DesignSystemProvider`

### Updating Tokens

1. Edit `platform-config/design-tokens/tokens.json`
2. Regenerate derived files:
   - `tokens.css` - CSS custom properties
   - `tokens.ts` - TypeScript exports
3. Run contrast checks: `node scripts/check-design-contrast.mjs`
4. All portals automatically receive updates

## Commands

```bash
# Run contrast validation
node scripts/check-design-contrast.mjs

# Format code
npx prettier --write .

# Lint projects
npx eslint web-portal/src --ext ts,tsx
npx eslint admin-portal/src --ext ts,tsx
npx eslint mobile-app/src --ext ts,tsx
```
