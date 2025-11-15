# Dust - Copilot Instructions

## Project Overview
Dust is an **offline-first Ionic/Angular mobile app** for Burning Man event guides. Built with **Angular 20+** using **standalone components** and **Capacitor 7** for iOS/Android. Uses **Bun** (not npm) for package management.

## Architecture

### Core Data Flow
- **Web Worker Pattern**: Heavy data processing happens in `src/app/data/app.worker.ts` (registered via `DataManager` class)
- **Worker Communication**: Services call `registerWorker()` / `call()` from `worker-interface.ts` to communicate with the worker
- **Storage Strategy**: 
  - App data → `idb-keyval` (IndexedDB wrapper) in web worker
  - User preferences → `@capacitor/preferences` 
  - Images → `@capacitor/filesystem` with Directory.Cache
  - Favorites → `FavoritesService` using Preferences API

### State Management
- **Angular Signals**: Primary reactive primitive (`signal()`, `computed()`, `WritableSignal`)
- **Dependency Injection**: Use `inject()` function, NOT constructor-based DI
- **Services**: All services use `@Injectable({ providedIn: 'root' })`

### Component Architecture
- **All components are standalone**: Set `standalone: true` (or omit as it's default in schematics)
- **Imports in decorator**: Add Ionic components to `imports: []` array in `@Component`
- **Ionic Standalone**: Import from `@ionic/angular/standalone` (e.g., `IonButton`, `IonContent`)
- **Lazy loading**: Routes use `loadComponent: () => import('./path').then(m => m.ComponentPage)`

## Key Patterns & Conventions

### Services
```typescript
// Use inject() for dependency injection
private db = inject(DbService);
private settings = inject(SettingsService);

// State with signals
public selectedDay = signal(noDate());
public isLoading = computed(() => this.status() === 'loading');
```

### Data Models
- Primary models in `src/app/data/models.ts`: `Event`, `Camp`, `Art`, `Dataset`, etc.
- Events have calculated properties (distance, star, happening) added by `DataManager`
- Use `Names` enum for dataset keys (e.g., `Names.events`, `Names.camps`)

### File Organization
- Feature folders: Each major feature has its own directory (e.g., `events/`, `map/`, `camps/`)
- Shared utilities: `src/app/utils/utils.ts` for common functions
- Data layer: `src/app/data/` contains all data services and worker logic

### Offline-First Approach
- Data downloads via `ApiService.download()` stored locally
- Check `DbService.get()` options: `onlyRead`, `freshOnce`, `onlyFresh`, `defaultValue`
- Network status tracked via `DbService.networkStatus` signal
- Environment flag `environment.offline` for special offline builds

## Development Workflow

### Commands (use Bun, not npm)
```bash
bun install                    # Install dependencies
bunx ng serve --open           # Dev server
bunx ng build                  # Production build
bun run build-prod             # Build with Sentry sourcemaps
bunx ng lint                   # Run linter
bun run format                 # Format code with Prettier
```

### Mobile Development
```bash
bunx ng build                  # Build web assets
bunx cap copy ios              # Copy to iOS
bunx cap run ios               # Build and run iOS
bunx cap copy android          # Copy to Android
bunx cap run android           # Build and run Android
```

### Pre-commit Hooks
- Husky configured to run `lint-staged`
- Auto-formats `.ts`, `.html`, `.css`, `.scss` with Prettier
- Runs ESLint on staged files

## Critical Integration Points

### Capacitor Plugins (Native Features)
- **Location**: `@capacitor/geolocation` for GPS coords
- **Notifications**: `@capacitor/local-notifications` + `@capacitor/push-notifications`
- **Storage**: `@capacitor/preferences` for key-value, `@capacitor/filesystem` for files
- **Networking**: `@capacitor/network` for connectivity status
- **Share**: `@capacitor/share` for native sharing

### Error Tracking
- Sentry initialized in `app.component.ts` with `@sentry/capacitor` and `@sentry/angular`
- Automatically captures app version/build from `@capacitor/app`

### Map System
- Custom SVG map rendering with geo-referencing (`src/app/map/`)
- Convert GPS ↔ Map coordinates via `gpsToMap()` / `mapToGps()` in `geo.utils.ts`
- Map data cached as images via `cache-store.ts`

## Common Gotchas

1. **Worker vs Main Thread**: Data processing in worker; UI updates in main thread services
2. **Time Zones**: All event times use `BurningManTimeZone` constant for consistency
3. **Dataset System**: Multi-year support via `Dataset` model with unique IDs
4. **Calculated Properties**: Many model properties calculated in `DataManager.populate()`
5. **Bun Required**: This project uses Bun, not npm - always use `bun`/`bunx` commands

## Testing & Quality

- Karma for unit tests: `bun test`
- ESLint with unused imports plugin, prefer-arrow, import rules
- Strict TypeScript: Check `tsconfig.json` for compiler options
- Web worker has separate `tsconfig.worker.json` targeting `webworker` lib

## External Data
- Backend API at `data.dust.events` (see `utils.ts` constants)
- Static/cached data at `static.dust.events`
- R2 storage at `r2data.dust.events`
