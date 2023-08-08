import { Component, ViewChild, effect } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Camp } from '../models';
import { DbService } from '../db.service';
import { CommonModule } from '@angular/common';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { MapPoint, toMapPoint } from '../map/map.component';
import { MapModalComponent } from '../map-modal/map-modal.component';
import { CampComponent } from '../camp/camp.component';
import { UiService } from '../ui.service';
import { SearchComponent } from '../search/search.component';
import { isWhiteSpace } from '../utils';

@Component({
  selector: 'app-camps',
  templateUrl: 'camps.page.html',
  styleUrls: ['camps.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule, ScrollingModule, MapModalComponent,
    CampComponent, SearchComponent]
})
export class CampsPage {
  camps: Camp[] = [];
  showMap = false;
  mapTitle = '';
  mapSubtitle = '';
  noCampsMessage = 'No camps were found.';
  mapPoints: MapPoint[] = [];
  minBufferPx = 900;
  @ViewChild(CdkVirtualScrollViewport) virtualScroll!: CdkVirtualScrollViewport;

  constructor(public db: DbService, private ui: UiService) {
    effect(() => {
      this.ui.scrollUp('camps', this.virtualScroll);
    });
  }

  home() {
    this.ui.home();
  }

  async ionViewDidEnter() {
    if (this.camps.length == 0) {
      this.camps = await this.db.getCamps(0, 9999);
    } else {
      // Hack to ensure tab view is updated on switch of tabs
      this.minBufferPx = (this.minBufferPx == 901) ? 900 : 901;
    }
  }

  search(value: string) {
    this.virtualScroll.scrollToOffset(0);
    this.update(value);
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
    this.noCampsMessage = isWhiteSpace(search) ? `No camps were found.` : `No camps were found matching "${search}"`;
  }
}
