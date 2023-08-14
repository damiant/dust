import { Component, ViewChild, effect } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { Art } from '../models';
import { DbService } from '../db.service';
import { Router, RouterLink, Scroll } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ArtComponent } from './art.component';
import { UiService } from '../ui.service';
import { SearchComponent } from '../search/search.component';
import { SkeletonArtComponent } from '../skeleton-art/skeleton-art.component';
import { delay, isWhiteSpace } from '../utils';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { GpsCoord } from '../map/geo.utils';
import { GeoService } from '../geo.service';

interface ArtState {
  showImage: boolean,
  busy: boolean,
  noArtMessage: string,
  arts: Art[],
  minBufferPx: number,
  byDist: boolean,
  displayedDistMessage: boolean
}


function initialState(): ArtState {
  return {
    showImage: false,
    busy: true,
    noArtMessage: 'No art was found',
    arts: [],
    minBufferPx: 1900,
    byDist: false,
    displayedDistMessage: false
  };
}

@Component({
  selector: 'app-arts',
  templateUrl: 'art.page.html',
  styleUrls: ['art.page.scss'],
  standalone: true,
  imports: [IonicModule, RouterLink, CommonModule, ScrollingModule,
    ArtComponent, SearchComponent, SkeletonArtComponent],
})
export class ArtPage {
  vm: ArtState = initialState();

  @ViewChild(CdkVirtualScrollViewport) virtualScroll!: CdkVirtualScrollViewport;

  constructor(
    public db: DbService,
    private ui: UiService,
    private router: Router,
    private geo: GeoService,
    private toastController: ToastController
  ) {
    effect(() => {
      this.ui.scrollUp('art', this.virtualScroll);
    });
    effect(() => {
      const year = this.db.selectedYear();
      console.log(`ArtPage.yearChange ${year}`);
      this.db.checkInit();
      this.vm = initialState();
      this.init();
    });
    effect(() => {
      const status = this.db.networkStatus();
      console.log(`Network status ${status}`);
      this.vm.showImage = (status == 'wifi');
    });
  }


  home() {
    this.ui.home();
  }

  async init() {
    try {
      this.vm.busy = true;
      await delay(100);
      await this.update(undefined);
    } finally {
      this.vm.busy = false;
    }
  }

  toggleByDist() {
    this.vm.byDist = !this.vm.byDist;
    if (this.vm.byDist && !this.vm.displayedDistMessage) {
      this.ui.presentToast(`Displaying art sorted by distance`, this.toastController);
      this.vm.displayedDistMessage = true;
    }
    this.ui.scrollUp('art', this.virtualScroll);
    this.update(undefined);
  }

  async ionViewDidEnter() {
    this.hack();
  }

  handleInput(event: any) {
    this.search(event.target.value);
  }

  search(val: string | undefined | null) {
    if (!val) return;
    this.virtualScroll.scrollToOffset(0, 'smooth');
    this.vm.noArtMessage = isWhiteSpace(val) ? `No art were found.` : `No art were found matching "${val}"`;
    this.update(val.toLowerCase());
  }

  private hack() {
    // Hack to ensure tab view is updated on switch of tabs or when day is changed
    this.vm.minBufferPx = (this.vm.minBufferPx == 1901) ? 1900 : 1901;
  }

  artTrackBy(index: number, art: Art) {
    return art.uid;
  }

  private async update(search: string | undefined) {
    let coords: GpsCoord | undefined = undefined;
    if (this.vm.byDist) {
      coords = await this.geo.getPosition();
    }
    console.log('art.page.update', coords);
    this.vm.arts = await this.db.findArts(search, coords);
  }

  click(art: Art) {
    this.router.navigate(['/art/' + art.uid + '+Art']);
  }
}
