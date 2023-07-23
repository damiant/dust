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
  {
    path: 'camp/:id',
    loadComponent: () => import('./camp/camp.page').then( m => m.CampPage)
  },
  {
    path: 'art/:id',
    loadComponent: () => import('./art-item/art-item.page').then( m => m.ArtItemPage)
  },
];
