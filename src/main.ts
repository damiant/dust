import { APP_INITIALIZER, enableProdMode, importProvidersFrom, provideExperimentalZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withComponentInputBinding } from '@angular/router';
import { provideIonicAngular, IonicRouteStrategy } from '@ionic/angular/standalone';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';
//import { provideServiceWorker } from '@angular/service-worker';
import { DbService } from './app/data/db.service';

if (environment.production) {
  enableProdMode();
  //window.console.log = () => { }
}

const appInitFactory =
  (dbService: DbService): (() => Promise<void>) =>
    async () =>
      await dbService.initWorker();

bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: APP_INITIALIZER, useFactory: appInitFactory, deps: [DbService], multi: true },
    provideExperimentalZonelessChangeDetection(),
    //provideZoneChangeDetection({ eventCoalescing: true }),
    provideIonicAngular({ mode: 'ios', swipeBackEnabled: true }),
    provideAnimations(),
    provideRouter(routes, withComponentInputBinding()),
    // provideServiceWorker('ngsw-worker.js', {
    //   // Service Worker seems to be causing problems
    //     enabled: !isDevMode(),
    //     registrationStrategy: 'registerWhenStable:30000'
    // })
  ],
});
