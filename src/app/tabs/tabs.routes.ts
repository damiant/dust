import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'events',
        loadComponent: () => import('../events/events.page').then((m) => m.EventsPage),
      },
      {
        path: 'camps',
        loadComponent: () => import('../camps/camps.page').then((m) => m.CampsPage),
      },
      {
        path: 'favs',
        loadComponent: () => import('../favs/favs.page').then((m) => m.FavsPage),
      },
      {
        path: 'favs/map',
        loadComponent: () => import('../fav-map/fav-map.page').then((m) => m.FavMapPage),
      },
      {
        path: 'art',
        loadComponent: () => import('../art/art.page').then((m) => m.ArtPage),
      },

      {
        path: 'rsl',
        loadComponent: () => import('../rsl/rsl.page').then((m) => m.RslPage),
      },
      {
        path: 'messages',
        loadComponent: () => import('../messages/messages.page').then((m) => m.MessagesPage),
      },
      {
        path: 'profile',
        loadComponent: () => import('../home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'profile/ice',
        loadComponent: () => import('../pin-map/pin-map.page').then((m) => m.PinMapPage),
      },
      {
        path: 'profile/about',
        loadComponent: () => import('../about/about.page').then((m) => m.AboutPage),
      },
      {
        path: 'profile/cache-management',
        loadComponent: () => import('../cache-management/cache-management.page').then((m) => m.CacheManagementPage),
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
    redirectTo: '/intro',
    pathMatch: 'full',
  },
];
