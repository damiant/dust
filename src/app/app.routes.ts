import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'event/:id',
    loadComponent: () => import('./event/event.page').then( m => m.EventPage)
  },
];
