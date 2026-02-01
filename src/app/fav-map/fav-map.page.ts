import { Component, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { MapComponent } from '../map/map.component';
import { FavoritesService } from '../favs/favorites.service';
import { DbService } from '../data/db.service';
import { MapPoint } from '../data/models';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-fav-map',
  templateUrl: './fav-map.page.html',
  styleUrls: ['./fav-map.page.scss'],
  imports: [
    FormsModule,
    MapComponent,
    IonHeader,
    IonContent,
    IonTitle,
    IonToast,
    IonToolbar,
    IonButtons,
    IonBackButton,
  ],
})
export class FavMapPage {
  private fav = inject(FavoritesService);
  private db = inject(DbService);
  isToastOpen = false;
  points: MapPoint[] = [];
  title = '';

  ionViewWillEnter() {
    const newTitle = this.fav.getMapPointsTitle();
    const newPoints = this.fav.getMapPoints();

    // Only update if the reference has changed (which means favorites were modified)
    // This prevents unnecessary map refresh when just navigating back
    if (this.points !== newPoints) {
      this.title = newTitle;
      this.points = newPoints;
    }

    if (this.db.anyLocationsHidden()) {
      this.isToastOpen = true;
    }
  }
}
