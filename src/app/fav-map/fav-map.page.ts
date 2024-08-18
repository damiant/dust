import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  standalone: true,
  imports: [
    CommonModule,
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
    this.title = this.fav.getMapPointsTitle();
    this.points = this.fav.getMapPoints();
    if (this.db.anyLocationsHidden()) {
      this.isToastOpen = true;
    }
  }
}
