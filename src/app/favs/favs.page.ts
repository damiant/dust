import { Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { Camp, Event } from '../models';
import { FavoritesService } from '../favorites.service';
import { EventComponent } from '../event/event.component';
import { DbService } from '../db.service';
import { CampComponent } from '../camp/camp.component';
import { MapPoint, toMapPoint } from '../map/map.component';
import { MapModalComponent } from '../map-modal/map-modal.component';

@Component({
  selector: 'app-favs',
  templateUrl: './favs.page.html',
  styleUrls: ['./favs.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule, EventComponent, CampComponent, MapModalComponent]
})
export class FavsPage implements OnInit {

  events: Event[] = [];
  camps: Camp[] = [];

  showMap = false;
  mapTitle = '';
  mapSubtitle = '';
  mapPoints: MapPoint[] = [];

  constructor(private fav: FavoritesService, private db: DbService) { 
    effect(() => {
      console.log('update fav');
      this.fav.changed();
      this.update();
    });
  }

  async ionViewWillEnter() {
     if (this.events.length == 0) {
      this.update();
     }
  }

  private async update() {
    const favs = await this.fav.getFavorites();
    this.events = await this.db.getEventList(favs.events);
    this.camps = await this.db.getCampList(favs.camps);
  }

  ngOnInit() {

  }

  mapEvent(event: Event) {    
    this.mapPoints = [toMapPoint(event.location)];
    this.mapTitle = event.name;
    this.mapSubtitle = event.location;
    this.showMap = true;
  }

  mapCamp(camp: Camp) {
    this.mapPoints = [toMapPoint(camp.location_string!)];
    this.mapTitle = camp.name;
    this.mapSubtitle = camp.location_string!;
    this.showMap = true;
  }

  eventsTrackBy(index: number, event: Event) {
    return event.uid;
  }

  campsTrackBy(index: number, camp: Camp) {
    return camp.uid;
  }
}
