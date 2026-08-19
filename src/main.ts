import {
  provideAppInitializer,
  enableProdMode,
  inject,
  provideZonelessChangeDetection,
  isDevMode,
} from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  PreloadAllModules,
  RouteReuseStrategy,
  provideRouter,
  withComponentInputBinding,
  withHashLocation,
  withPreloading,
} from '@angular/router';
import { provideIonicAngular, IonicRouteStrategy } from '@ionic/angular/standalone';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';
import { Capacitor } from '@capacitor/core';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';
import { DbService } from './app/data/db.service';
import { SettingsService } from './app/data/settings.service';
import { StartupService } from './app/data/startup.service';

if (environment.production) {
  enableProdMode();
  //window.console.log = () => { }
}

function shouldEnableServiceWorker(): boolean {
  // Only enable service worker on web platform
  // Disable on iOS and Android to prevent caching issues and weird behavior
  const platform = Capacitor.getPlatform();
  const isWebPlatform = platform === 'web';

  // Enable service worker in production builds or when explicitly in production environment
  const shouldEnable = isWebPlatform && (environment.production || !isDevMode());

  console.log(
    `[ServiceWorker] Platform detected: ${platform}, production: ${environment.production}, devMode: ${isDevMode()}, enabling SW: ${shouldEnable}`,
  );

  return shouldEnable;
}

bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideAppInitializer(async () => {
      const startup = inject(StartupService);
      // Detect a previous run that never finished starting up. If found, clear
      // all local data so the app boots clean (same effect as delete + reinstall).
      if (startup.isStuck()) {
        console.warn('StartupService: previous startup never completed. Clearing all stored data.');
        await startup.clearAll();
      }
      // Flag startup as in progress before any data is read.
      startup.markStarted();

      const dbService = inject(DbService);
      const settings = inject(SettingsService);
      await settings.init();
      await dbService.initWorker();
    }),
    provideZonelessChangeDetection(),
    //provideZoneChangeDetection({ eventCoalescing: true }),
    provideIonicAngular({
      mode: 'ios',
      swipeBackEnabled: true,
      innerHTMLTemplatesEnabled: true,
    }),
    environment.offline
      ? provideRouter(routes, withComponentInputBinding(), withPreloading(PreloadAllModules), withHashLocation())
      : provideRouter(routes, withComponentInputBinding()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: shouldEnableServiceWorker(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
});
