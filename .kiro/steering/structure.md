# Project Structure

## Root Level
```
dust/
├── src/                    # Source code
├── www/                    # Built output (web)
├── android/                # Android native project
├── ios/                    # iOS native project
├── scripts/                # Build and data processing scripts
├── resources/              # App icons and splash screens
├── .admin-app/             # Pre-built admin dashboard
├── .kiro/                  # Kiro IDE configuration
├── .husky/                 # Git hooks
├── .vscode/                # VS Code settings
├── angular.json            # Angular CLI configuration
├── capacitor.config.ts     # Capacitor configuration
├── tsconfig.json           # TypeScript configuration
├── vitest.config.ts        # Vitest configuration
└── package.json            # Dependencies and scripts
```

## Source Structure (`src/`)

### Core Application
```
src/
├── app/                    # Angular application root
│   ├── app.component.*     # Root component
│   ├── app.routes.ts       # Route definitions
│   ├── *.service.ts        # Application services
│   │   ├── calendar.service.ts
│   │   ├── rating.service.ts
│   │   └── update.service.ts
│   │
│   └── [feature]/          # Feature modules (standalone components)
│       ├── [feature].component.ts
│       ├── [feature].component.html
│       ├── [feature].component.scss
│       ├── [feature].page.ts       # Page variant
│       ├── [feature].page.html
│       └── [feature].page.scss
│
├── assets/                 # Static assets
│   ├── icons/              # App icons
│   ├── icon/               # Favicon
│   ├── map-*.svg           # Map files (year-specific)
│   └── *.svg               # SVG assets
│
├── environments/           # Environment configurations
│   ├── environment.ts
│   ├── environment.prod.ts
│   ├── environment.offline.ts
│   ├── environment.vegas.ts
│   └── environment.snrg.ts
│
├── media/                  # Font files
├── theme/                  # Global styles
│   └── variables.scss      # SCSS variables
│
├── global.scss             # Global styles
├── index.html              # HTML entry point
├── main.ts                 # Application bootstrap
├── manifest.webmanifest    # PWA manifest
├── polyfills.ts            # Browser polyfills
├── zone-flags.ts           # Zone.js configuration
└── ngsw-config.json        # Service worker config
```

## Feature Components

### Major Features
- **home** - Main dashboard/landing
- **events** - Event listing and discovery
- **event** - Individual event detail
- **camps** - Theme camp listing
- **camp** - Individual camp detail
- **art** - Art installation listing
- **art-item** - Individual art detail
- **map** - Map visualization
- **map-modal** - Map modal overlay
- **search** - Search functionality
- **favs** - Favorites management
- **messages** - Messaging system
- **notifications** - Notification management
- **reminders** - Event reminders

### UI Components
- **ui/** - Reusable UI components
- **tile/** - Tile/card components
- **carousel/** - Carousel/slider components
- **skeleton-*** - Loading skeleton screens
- **card-header** - Card header component

### Utility Features
- **geolocation** - Location services
- **pin-map** - Pin-based mapping
- **sort** - Sorting utilities
- **share** - Share functionality
- **link** - Link handling
- **cached-img** - Image caching

## Build Output

### Web Build (`www/`)
```
www/
├── browser/                # Production web build
│   ├── index.html
│   ├── main-*.js           # Main bundle
│   ├── chunk-*.js          # Code-split chunks
│   ├── styles-*.css        # Compiled styles
│   ├── assets/             # Static assets
│   ├── media/              # Font files
│   ├── ngsw-worker.js      # Service worker
│   └── manifest.webmanifest
```

### Admin App (`.admin-app/`)
Pre-built admin dashboard with separate chunk files and assets.

## Scripts (`scripts/`)
- `copy-admin.ts` - Copy admin app to build output
- `copy-online.ts` - Copy online data to build
- `DustToGoogle.gs` - Google Sheets integration script

## Configuration Files

### Build & Development
- `angular.json` - Angular CLI configuration with multiple build targets
- `tsconfig.json` - TypeScript compiler options (strict mode)
- `tsconfig.app.json` - App-specific TypeScript config
- `tsconfig.spec.json` - Test TypeScript config
- `tsconfig.worker.json` - Web Worker TypeScript config
- `vitest.config.ts` - Vitest test runner config

### Code Quality
- `.eslintrc.json` - ESLint rules
- `.prettierrc.json` - Prettier formatting rules
- `.prettierignore` - Prettier ignore patterns
- `.editorconfig` - Editor configuration

### Mobile & Deployment
- `capacitor.config.ts` - Capacitor native configuration
- `ionic.config.json` - Ionic CLI configuration
- `appflow.config.json` - Ionic Appflow CI/CD
- `netlify.toml` - Netlify deployment config

### Version Control
- `.gitignore` - Git ignore patterns
- `.husky/` - Git hooks (pre-commit, pre-push)

## Component Naming Conventions

### Standalone Components
- File: `[feature].component.ts`
- Class: `[Feature]Component`
- Selector: `app-[feature]`
- Decorator: `@Component({ standalone: true })`

### Page Components
- File: `[feature].page.ts`
- Class: `[Feature]Page`
- Selector: `app-[feature]-page`

### Services
- File: `[feature].service.ts`
- Class: `[Feature]Service`
- Decorator: `@Injectable({ providedIn: 'root' })`

## Styling
- **SCSS** - All styles use SCSS (not CSS)
- **Global styles** - `src/global.scss`
- **Theme variables** - `src/theme/variables.scss`
- **Component styles** - Co-located with component files
- **Ionic components** - Use Ionic CSS variables

## Data & State Management
- **RxJS** - Reactive data flows via services
- **IndexedDB** - Offline data storage via idb-keyval
- **Service Worker** - Offline caching strategy
- **Environment files** - Configuration per build target

## Testing
- **Unit tests** - Co-located with source files (`.spec.ts`)
- **Test runner** - Vitest
- **Test config** - `vitest.config.ts`
- **JSDOM** - DOM simulation for tests
