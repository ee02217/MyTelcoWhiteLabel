# Web Portal

Customer-facing web portal built with Vite + React + TypeScript for the Telco Self-Care White-Label Platform.

## Tech Stack

- **Framework:** Vite + React 18
- **Language:** TypeScript
- **Styling:** CSS with shared design tokens

## Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥18.x |
| npm | ≥9.x |

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev

# The app will be available at http://localhost:3000
```

### Build Commands

```bash
# Type check
npm run typecheck

# Lint code
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
web-portal/
├── src/
│   ├── main.tsx         # Entry point
│   ├── App.tsx          # Main application component
│   └── index.css       # Global styles with design tokens
├── index.html          # HTML template
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
├── tsconfig.node.json  # TypeScript node config
└── package.json        # Dependencies and scripts
```

## Design Tokens

This portal consumes shared design tokens from:
`../platform-config/design-tokens/`

Tokens are imported in two ways:
1. **CSS Variables:** `index.css` imports `tokens.css` for CSS custom properties
2. **JSON:** Direct import of `tokens.json` for programmatic access

```typescript
// Import tokens as JSON
import tokens from '@my-telco/design-tokens';
console.log(tokens.color.primary[500]); // #0073e6
```

## Next Steps

- Add routing with React Router
- Integrate with BFF services
- Implement authentication
- Apply white-label theming
