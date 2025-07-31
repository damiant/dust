import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'intro',
    loadComponent: () => import('./intro/intro.page').then((m) => m.IntroPage),
  },
  {
    path: 'event/:id',
    loadComponent: () => import('./event/event.page').then((m) => m.EventPage),
  },
  {
    path: 'camp/:id',
    loadComponent: () => import('./camp/camp.page').then((m) => m.CampPage),
  },
  {
    path: 'art/:id',
    loadComponent: () => import('./art-item/art-item.page').then((m) => m.ArtItemPage),
  },
  {
    path: 'map/:mapType',
    loadComponent: () => import('./pin-map/pin-map.page').then((m) => m.PinMapPage),
  },
  {
    path: 'map/:mapType/:thingName',
    loadComponent: () => import('./pin-map/pin-map.page').then((m) => m.PinMapPage),
  },

  {
    path: 'intro',
    loadComponent: () => import('./intro/intro.page').then((m) => m.IntroPage),
  },
  {
    path: 'about',
    loadComponent: () => import('./about/about.page').then((m) => m.AboutPage),
  },
  {
    path: 'search',
    loadComponent: () => import('./search/search.page').then(m => m.SearchPage)
  },
  {
    path: 'print-favs',
    loadComponent: () => import('./print-favs/print-favs.page').then( m => m.PrintFavsPage)
  },
  {
    path: 'messages',
    loadComponent: () => import('./messages/messages.page').then( m => m.MessagesPage)
  }
];
