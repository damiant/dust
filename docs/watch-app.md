# Apple Watch companion — Update Watch

The Dust iPhone app copies a **Watch Catalog** to a paired Apple Watch from
Favorites **⋯ ▸ Update Watch**. The watch then chooses locally: nearest
Restroom or Ice, Favorite Camps and Art (nearest first), and upcoming Favorite
Events and Parties. Tracking uses the watch's **own GPS** and shows a
compass-needle arrow, live straight-line distance, the destination name, and
**Stop**.

This is a **native** watchOS feature. watchOS cannot run the Capacitor/Angular
stack, so it lives as a SwiftUI companion app bridged to the JS layer via
WatchConnectivity.

## Architecture

```
Angular Favorites page (favs.page.html)
  └─ "Update Watch" menu item (only on iOS + installed watch)
      └─ buildWatchCatalog + WatchService.sendCatalog
            └─ @capacitor/core registerPlugin('WatchConnectivity')
                  └─ iOS: WatchConnectivityPlugin (ios/App/WatchConnectivityPlugin.swift)
                        └─ WCSession.updateApplicationContext + sendMessage
                              └─ watchOS: WatchViewModel (Watch Catalog JSON)
                                    └─ SwiftUI: chooser list → compass
                                    └─ CoreLocation: nearest sort, live distance
```

## What's already in the repo

- `src/app/watch/watch.catalog.ts` — builds the catalog from Favorites plus
  Restroom and Ice points. Upcoming-only Events/Parties. Unit tested.
- `src/app/watch/watch.service.ts` — JS wrapper (`isWatchAvailable`,
  `sendCatalog`). Guards non-iOS and structured errors. Unit tested.
- `src/app/favs/favs.page.ts` / `.html` — "Update Watch" in the Favorites "…"
  menu, hidden unless a watch is available; success toast + haptic or a
  "Watch not available" alert.
- `ios/App/WatchConnectivityPlugin.swift` — the native Capacitor plugin.
- `ios/App/AppBridgeViewController.swift` — registers the plugin once the
  Capacitor bridge is ready.
- `ios/dust-watch/DustWatch/` — the watchOS app sources (seed for the Xcode
  target). Live target: `ios/App/Dust Watch App/`.

## Manual Xcode steps (required once)

These steps require Xcode + an Apple Developer account and cannot be done from
the CLI reliably, so they are documented here.

### 1. Add the native bridge to the iOS app target

1. Open `ios/App/App.xcworkspace` (use the workspace so CocoaPods are linked).
2. Add **`App/AppBridgeViewController.swift`** and
   **`App/WatchConnectivityPlugin.swift`** to the **`App`** target
   (File ▸ Add Files… ▸ check the App target; enable "Add to target").
3. In **`App/App/Base.lproj/Main.storyboard`**, change the root view
   controller's class from `CAPBridgeViewController` (module `Capacitor`) to
   **`AppBridgeViewController`** (module `App`).
   - This subclass registers `WatchConnectivityPlugin` in `capacitorDidLoad()`.
4. Link the **WatchConnectivity** framework (it's part of the SDK; add via
   target ▸ Frameworks, Libraries ▸ `+` ▸ WatchConnectivity).

> Note: `npx cap sync` copies web assets and syncs pods but does **not**
> regenerate the Xcode project, so your additions persist. Avoid deleting and
> re-running `cap add ios`.

### 2. Create the watchOS app target

1. **File ▸ New ▸ Target ▸ watchOS ▸ Watch App**. Name the product
   **Dust Watch**, keep **SwiftUI** lifecycle, and check **Embed in Application**
   = the **`App`** target.
2. Delete the generated template files and add the sources from
   `ios/dust-watch/DustWatch/`:
   - `DustWatchApp.swift`
   - `WatchCatalog.swift`
   - `WatchViewModel.swift`
   - `ContentView.swift`
3. Set **deployment target ≥ watchOS 10.0** (the code uses SwiftUI
   `.animation(_:value:)`, which requires watchOS 10+, and CoreLocation `heading`).

3. **Location permission (watch)**: The watch target uses
   `GENERATE_INFOPLIST_FILE = YES` (no `Info.plist` file), so the permission is
   a **build setting**, not a plist edit. Both watch configurations already set
   `INFOPLIST_KEY_NSLocationWhenInUseUsageDescription`. If you recreate the
   target, add it under Build Settings (Debug + Release):
   `INFOPLIST_KEY_NSLocationWhenInUseUsageDescription` = `Uses your location to
   point toward places on the playa.`
   (`requestWhenInUseAuthorization()` is called while the catalog is on the
   watch so lists can sort by nearest; a foreground "when in use" permission is
   all this feature needs.)

### 4. Signing / provisioning

1. Select the watch app + extension targets, set your **Team**.
2. Add the watch bundle IDs to your App ID, or enable **Automatically manage
   signing** on all three targets (App, watch app, extension) so Xcode registers
   the companion identifiers.
3. WatchConnectivity requires the iOS app and watch app to be installed together
   — they are, because the watch app is embedded in the iOS app.

### 5. Build & verify

1. Build the iOS app with the watch app embedded (Product ▸ Build).
2. Pair a real Apple Watch (a watchOS **simulator** does not support
   WatchConnectivity messaging reliably — test on a device).
3. Launch the iPhone app → **Favorites ▸ ⋯ ▸ Update Watch**.
   - Success toast appears and the watch shows Restroom, Ice, Camps, Art, Events.
   - Restroom / Ice start the compass to the nearest point.
   - Camps / Art / Events open a shortlist; tap a placed row for the compass.
   - Distance on the compass counts down as you walk. **Stop** returns to the list.

## Behavior notes (as designed)

- The watch uses its **own GPS** after Update Watch; choosing and tracking work
  even when the iPhone is back at camp.
- Star something later, then Update Watch again — the catalog is a snapshot.
- Restroom and Ice pick the nearest point **at tap time** and stick to it.
  Distance and bearing to that point update as you walk.
- Camps and Art lists sort nearest-first. Events and Parties sort soonest-first
  and drop off the watch when they end.
- Rows without a place (art-car Parties) are listed; tap does not start the
  compass.
- The arrow is a **compass needle**: it rotates so "up" on screen = the way to
  walk, using the watch heading, falling back to GPS course when no compass
  heading is available.
- Distance is **straight-line, imperial** ("0.6 mi" / "950 ft").
- Entering ~15 m of the destination shows an **"You've arrived"** state + haptic;
  Stop still exits.

## Things to double-check before building

- **Plugin loads**: `WatchConnectivityPlugin` must conform to `CAPBridgedPlugin`
  (it declares `identifier`/`jsName`/`pluginMethods`). If the plugin didn't
  conform, `registerPluginInstance` logs "Not loading plugin" and the JS call
  silently fails — check the Xcode console if nothing happens on tap.
- **No iPhone-side permission needed**: the iOS app already declares
  `NSLocationWhenInUseUsageDescription`. The watch app is the one that needs
  its own location key (added in step 3 above).
- **WatchConnectivity has no entitlements requirement** — no App Group, no
  special capability. Just the same Team on all targets and the watch app
  embedded in the iOS app.
- **Delivery when the watch app is closed**: `sendCatalog` always writes the
  application context; the catalog appears the next time the watch app is
  opened. A reachable live message also refreshes an already-open watch app.
- **Compatibility**: embedding a watchOS 10 companion app needs **Xcode 15+**, and
  it only pairs with an iPhone running **iOS 17+**. The iOS app's own deployment
  target must be high enough to embed the watch app.
- **Don't run `npx cap add ios` again** after wiring the bridge, as it rebuilds
  the native project. `npx cap sync` (web assets + pods) is fine and won't
  remove your added Swift files or the storyboard edit.
