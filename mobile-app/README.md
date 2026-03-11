# Mobile App

React Native mobile application built with Expo for the Telco Self-Care White-Label Platform.

## Tech Stack

- **Framework:** React Native with Expo SDK 52
- **Language:** TypeScript
- **Target Platforms:** iOS, Android

## Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥18.x |
| npm | ≥9.x |
| Expo CLI | Latest |

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start Expo development server
npm run start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on web
npm run web
```

### Build Commands

```bash
# Type check
npm run typecheck

# Lint code
npm run lint

# Build for production
npm run build
```

### Prebuild (for native projects)

```bash
# Generate native Android/iOS projects
npm run prebuild
```

## Project Structure

```
mobile-app/
├── App.tsx              # Main application component
├── app.json             # Expo configuration
├── babel.config.js      # Babel configuration
├── tsconfig.json        # TypeScript configuration
├── package.json         # Dependencies and scripts
└── assets/              # App icons and splash screens
```

## Design Tokens

Shared design tokens are available in:
`../platform-config/design-tokens/`

Import tokens in your app:
```typescript
// Using tokens directly
import tokens from '../platform-config/design-tokens/tokens.json';
```

## Troubleshooting

### Metro bundler issues
```bash
npx expo start --clear
```

### Android build errors
```bash
# Clean and rebuild
cd android
./gradlew clean
cd ..
npx expo run:android
```

## Next Steps

- Add navigation with `expo-router`
- Integrate with backend services
- Apply white-label theming
