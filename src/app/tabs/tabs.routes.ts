import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'events',
        loadComponent: () =>
          import('../events/events.page').then((m) => m.EventsPage),
      },
      {
        path: 'camps',
        loadComponent: () =>
          import('../camps/camps.page').then((m) => m.CampsPage),
      },
      {
        path: 'art',
        loadComponent: () =>
          import('../art/art.page').then((m) => m.ArtPage),
      },
      {
        path: '',
        redirectTo: '/tabs/events',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/events',
    pathMatch: 'full',
  },
];
