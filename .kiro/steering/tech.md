# Tech Stack & Build System

## Core Framework
- **Angular 21** - Frontend framework with standalone components
- **Ionic 8** - Mobile UI framework and components
- **Capacitor 7** - Native iOS/Android bridge
- **TypeScript 5.9** - Strict mode enabled
- **RxJS 7.8** - Reactive programming

## Build & Package Management
- **Bun** - Package manager and task runner (primary)
- **Angular CLI 21** - Build tooling
- **Vite** - Build optimization (NG_BUILD_OPTIMIZE_CHUNKS)

## Testing & Quality
- **Vitest 4** - Unit testing framework
- **ESLint 9** - Linting with Angular-specific rules
- **Prettier 3.6** - Code formatting
- **Husky 9** - Git hooks for pre-commit/pre-push checks

## Mobile & Native
- **Capacitor plugins**: Geolocation, Push Notifications, Local Notifications, Filesystem, Keyboard, Network, Preferences, App Launcher, Browser, Share, Screen Orientation, Status Bar, In-App Review, Keep Awake, Text Zoom, Safe Area, Print Webview, File Sharer, Navigation Bar, App Update
- **Firebase**: Messaging, Core, Installations
- **Sentry**: Error tracking and source map management

## Key Libraries
- **Three.js 0.181** - 3D graphics (map visualization)
- **Fuse.js 7** - Fuzzy search
- **idb-keyval 6** - IndexedDB wrapper for offline storage
- **Ionicons 7** - Icon library

## Common Commands

### Development
```bash
bun install              # Install dependencies
bun start               # Start dev server (ng serve)
bun run watch           # Watch mode build
```

### Building
```bash
bun run build-prod      # Production build with Sentry sourcemaps
bun run build-offline-mango    # Offline build with base-href
bun run build-offline-part2    # Copy admin app and online data
```

### Mobile
```bash
bunx ng build           # Build web assets
bunx cap copy ios       # Copy to iOS project
bunx cap run ios        # Run on iOS simulator
bunx cap copy android   # Copy to Android project
bunx cap run android    # Run on Android emulator
```

### Code Quality
```bash
bun run lint            # Run ESLint
bun run format          # Format code with Prettier
bun run test            # Run Vitest tests
bun run precommit       # Pre-commit checks (lint + format)
```

### Deployment
```bash
bun run deploy-preview-app     # Deploy to Netlify production
bun run sentry:sourcemaps      # Upload sourcemaps to Sentry
```

### Data Scripts
```bash
bun run download               # Download event data for multiple years
bun run download-this-year     # Download current year data
bun run rsl                    # Process Rock Star Librarian data
bun run restrooms             # Process restroom data
```

## Build Configurations
- **production** - Optimized, with Sentry integration
- **development** - Unoptimized, source maps enabled
- **offline** - Offline-first with base-href for static hosting
- **vegas** - Alternative event configuration
- **snrg** - Alternative event configuration

## Output Paths
- Web build: `www/browser/`
- Admin app: `.admin-app/`
- TypeScript output: `dist/out-tsc/`

## Environment Files
Located in `src/environments/`:
- `environment.ts` - Default/development
- `environment.prod.ts` - Production
- `environment.offline.ts` - Offline mode
- `environment.vegas.ts` - Vegas configuration
- `environment.snrg.ts` - SNRG configuration

## Code Style
- **Strict TypeScript** - No implicit any, strict null checks
- **Standalone Components** - Angular 14+ standalone API
- **SCSS** - Styling language (not CSS)
- **Prettier formatting** - Enforced via pre-commit hooks
- **ESLint rules** - Angular-specific linting

## Service Worker
- **Angular Service Worker** - Offline caching via `src/ngsw-config.json`
- **Web Worker** - TypeScript config at `tsconfig.worker.json`

## Performance Budgets
- Initial bundle: 2MB warning / 5MB error
- Component styles: 4KB warning / 6KB error
