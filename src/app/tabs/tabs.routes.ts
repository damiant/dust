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
        path: 'tab3',
        loadComponent: () =>
          import('../tab3/tab3.page').then((m) => m.Tab3Page),
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
