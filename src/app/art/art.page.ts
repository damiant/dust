import { Component, ViewChild, effect } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Art } from '../models';
import { DbService } from '../db.service';
import { Router, RouterLink, Scroll } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ArtComponent } from './art.component';
import { UiService } from '../ui.service';
import { SearchComponent } from '../search/search.component';
import { Network } from '@capacitor/network';
import { SkeletonArtComponent } from '../skeleton-art/skeleton-art.component';
import { isWhiteSpace } from '../utils';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';

interface ArtState {
  showImage: boolean,
  busy: boolean,
  noArtMessage: string,
  arts: Art[],
  minBufferPx: number
}


function initialState(): ArtState {
  return {
    showImage: false,
    busy: true,
    noArtMessage: 'No art was found',
    arts: [],
    minBufferPx: 1900
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

  constructor(public db: DbService, private ui: UiService, private router: Router) {
    effect(() => {
      this.ui.scrollUp('art', this.virtualScroll);
    });
    effect(() => {
      const year = this.db.selectedYear();
      console.log(`ArtPage.yearChange ${year}`);
      this.vm = initialState();
      this.init();
    });
  }


  home() {
    this.ui.home();
  }

  init() {
    this.vm.busy = true;
    setTimeout(async () => {
      try {
        const status = await Network.getStatus();
        this.vm.showImage = (status.connectionType == 'wifi');
        await this.update(undefined);
      } finally {
        this.vm.busy = false;
      }
    }, 500);
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
    this.vm.arts = await this.db.findArts(search);
  }

  click(art: Art) {
    this.router.navigate(['/art/' + art.uid + '+Art']);
  }
}
