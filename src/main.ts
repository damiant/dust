import { provideAppInitializer, enableProdMode, provideExperimentalZonelessChangeDetection, inject } from '@angular/core';
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

bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideAppInitializer(async () => {
      const dbService = inject(DbService);
      await dbService.initWorker();
    }),
    provideExperimentalZonelessChangeDetection(),
    //provideZoneChangeDetection({ eventCoalescing: true }),
    provideIonicAngular({ mode: 'ios', swipeBackEnabled: true }),    
    provideRouter(routes, withComponentInputBinding()),
    // provideServiceWorker('ngsw-worker.js', {
    //   // Service Worker seems to be causing problems
    //     enabled: !isDevMode(),
    //     registrationStrategy: 'registerWhenStable:30000'
    // })
  ],
});
