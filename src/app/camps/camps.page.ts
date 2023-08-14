import { Component, ViewChild, effect } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Camp, MapPoint } from '../models';
import { DbService } from '../db.service';
import { CommonModule } from '@angular/common';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { MapModalComponent } from '../map-modal/map-modal.component';
import { CampComponent } from '../camp/camp.component';
import { UiService } from '../ui.service';
import { SearchComponent } from '../search/search.component';
import { isWhiteSpace } from '../utils';
import { toMapPoint } from '../map/map.utils';

interface CampsState {
  camps: Camp[],
  showMap: boolean,
  mapTitle: string,
  mapSubtitle: string,
  noCampsMessage: string,
  mapPoints: MapPoint[],
  minBufferPx: number
}

function initialState(): CampsState {
  return {
    camps: [],
    showMap: false,
    mapTitle: '',
    mapSubtitle: '',
    noCampsMessage: 'No camps were found.',
    mapPoints: [],
    minBufferPx: 900
  };
}

@Component({
  selector: 'app-camps',
  templateUrl: 'camps.page.html',
  styleUrls: ['camps.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule, ScrollingModule, MapModalComponent,
    CampComponent, SearchComponent]
})
export class CampsPage {
  vm: CampsState = initialState();

  @ViewChild(CdkVirtualScrollViewport) virtualScroll!: CdkVirtualScrollViewport;

  constructor(public db: DbService, private ui: UiService) {
    effect(() => {
      this.ui.scrollUp('camps', this.virtualScroll);
    });
    effect(() => {
      const year = this.db.selectedYear();
      console.log(`CampsPage.yearChange ${year}`);
      this.db.checkInit();
      this.vm = initialState();
      this.update('');
    });
  }

  home() {
    this.ui.home();
  }

  async ionViewDidEnter() {
    // Hack to ensure tab view is updated on switch of tabs
    this.vm.minBufferPx = (this.vm.minBufferPx == 901) ? 900 : 901;
  }

  search(value: string) {
    this.virtualScroll.scrollToOffset(0);
    this.update(value);
  }

  campsTrackBy(index: number, camp: Camp) {
    return camp.uid;
  }

  map(camp: Camp) {
    this.vm.mapPoints = [toMapPoint(camp.location_string!)];
    this.vm.mapTitle = camp.name;
    this.vm.mapSubtitle = camp.location_string!;
    this.vm.showMap = true;
  }

  async update(search: string) {
    this.vm.camps = await this.db.findCamps(search);
    this.vm.noCampsMessage = isWhiteSpace(search) ? `No camps were found.` : `No camps were found matching "${search}"`;
  }
}
