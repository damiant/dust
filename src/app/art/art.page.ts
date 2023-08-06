import { Component, ViewChild, effect } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Art } from '../models';
import { DbService } from '../db.service';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { ArtComponent } from './art.component';
import { UiService } from '../ui.service';
import { SearchComponent } from '../search/search.component';
import { Network } from '@capacitor/network';

@Component({
  selector: 'app-arts',
  templateUrl: 'art.page.html',
  styleUrls: ['art.page.scss'],
  standalone: true,
  imports: [IonicModule, RouterLink, CommonModule,
    ScrollingModule, ArtComponent, SearchComponent],
})
export class ArtPage {
  showImage = false;
  arts: Art[] = [];
  minBufferPx = 900;

  @ViewChild(CdkVirtualScrollViewport) virtualScroll!: CdkVirtualScrollViewport;

  constructor(public db: DbService, private ui: UiService) {
    effect(() => {
      this.ui.scrollUp('art', this.virtualScroll);
    });
  }

  home() {
    this.ui.home();
  }

  async ionViewDidEnter() {
    const status = await Network.getStatus();
    this.showImage = (status.connectionType == 'wifi');
    if (this.arts.length == 0) {
      this.update(undefined);
    } else {
      // Hack to ensure tab view is updated on switch of tabs
      this.minBufferPx = (this.minBufferPx == 901) ? 900 : 901;

    }
  }

  handleInput(event: any) {
    this.search(event.target.value);
  }

  search(val: string | undefined | null) {
    if (!val) return;
    this.virtualScroll.scrollToOffset(0);
    this.update(val.toLowerCase());
  }

  artTrackBy(index: number, art: Art) {
    return art.uid;
  }

  async update(search: string | undefined) {
    this.arts = await this.db.findArts(search);
  }
}
