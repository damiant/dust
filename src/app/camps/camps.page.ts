import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Camp } from '../models';
import { DbService } from '../db.service';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MapPoint, toMapPoint } from '../map/map.component';
import { MapModalComponent } from '../map-modal/map-modal.component';

@Component({
  selector: 'app-camps',
  templateUrl: 'camps.page.html',
  styleUrls: ['camps.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule, ScrollingModule, MapModalComponent]
})
export class CampsPage {
  camps: Camp[] = [];
  showMap = false;
  mapTitle = '';
  mapSubtitle = '';
  mapPoints: MapPoint[] = [];

  constructor(private db: DbService) { }

  async ionViewDidEnter() {
    this.camps = await this.db.getCamps(0, 9999);
  }

  handleInput(event: any) {
    this.update(event.target.value.toLowerCase());
  }

  campsTrackBy(index: number, camp: Camp) {
    return camp.uid;
  }

  map(camp: Camp) {
    this.mapPoints = [toMapPoint(camp.location_string!)];
    this.mapTitle = camp.name;
    this.mapSubtitle = camp.location_string!;
    this.showMap = true;
  }

  async update(search: string) {
    this.camps = await this.db.findCamps(search);
  }
}
