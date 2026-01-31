# Project Guidelines and Patterns

## Package Management
- **Use Bun**: Always use `bun` for package management and running scripts instead of `npm` or `yarn`.
  - Example: `bun install`, `bun run build`, `bun test`.

## Angular Patterns
### Architecture
- **Standalone Components**: Use standalone components (`standalone: true` is default in v19+, but ensure `imports` array is used).
  - Import Ionic components directly from `@ionic/angular/standalone`.
  - Example: `imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule]`
- **Dependency Injection**: Use `inject()` function for dependency injection instead of constructor arguments.
  - Example: `private db = inject(DbService);`

### State Management & Reactivity
- **Signals**: Prioritize Angular Signals for state and inputs/outputs.
  - Inputs: `myInput = input<string>('');`
  - Outputs: `myOutput = output<void>();`
  - Computed: `isValid = computed(() => this.count() > 0);`
  - Effects: Use `effect()` for side effects in `constructor`.

### Template Syntax
- **Control Flow**: Use the new built-in control flow syntax.
  - `@if (condition) { ... }`
  - `@for (item of items; track item.id) { ... }`
  - `@switch (value) { ... }`

## Ionic & Capacitor
- **Icons**: Register icons using `addIcons` in the constructor or initialization logic.
- **Native Features**: specific native functionality (Haptics, etc.) should be accessed via Capacitor plugins.

## Pre-Commit & Quality
- **Linting**: Use `bun run lint` (it includes the necessary `--max-old-space-size=8192` memory boost).
- **Formatting**: Use `bun run format`.

## Developer Setup
- **VS Code Recommendations**:
  - Enable **Auto-fix on save** for ESLint to automatically remove unused imports.
  - Enable **Organize Imports on save**.
  - Example `settings.json`:
    ```json
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": "explicit",
      "source.organizeImports": "explicit"
    }
    ```
