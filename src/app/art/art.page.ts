import { Component, ViewChild, effect } from '@angular/core';
import { IonContent, IonicModule } from '@ionic/angular';
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

@Component({
  selector: 'app-arts',
  templateUrl: 'art.page.html',
  styleUrls: ['art.page.scss'],
  standalone: true,
  imports: [IonicModule, RouterLink, CommonModule, ScrollingModule,
    ArtComponent, SearchComponent, SkeletonArtComponent],
})
export class ArtPage {
  showImage = false;
  public busy = true;
  public noArtMessage = 'No art was found';
  arts: Art[] = [];
  minBufferPx = 1900;
  @ViewChild(CdkVirtualScrollViewport) virtualScroll!: CdkVirtualScrollViewport;

  constructor(public db: DbService, private ui: UiService, private router: Router) {
    effect(() => {
      this.ui.scrollUp('art', this.virtualScroll);
    });
  }

  home() {
    this.ui.home();
  }

  async ionViewDidEnter() {
    if (this.arts.length > 0) {
      this.hack();
      return;
    }

    this.busy = true;
    setTimeout(async () => {
      try {
        const status = await Network.getStatus();
        this.showImage = (status.connectionType == 'wifi');
        await this.update(undefined);
      } finally {
        this.busy = false;
      }
    }, 500);

  }

  handleInput(event: any) {
    this.search(event.target.value);
  }

  search(val: string | undefined | null) {
    if (!val) return;
    this.virtualScroll.scrollToOffset(0, 'smooth');
    console.log(`Search for art "${val}"`);
    this.noArtMessage = isWhiteSpace(val) ? `No art were found.` : `No art were found matching "${val}"`;
    this.update(val.toLowerCase());
  }

  private hack() {
    // Hack to ensure tab view is updated on switch of tabs or when day is changed
    this.minBufferPx = (this.minBufferPx == 1901) ? 1900 : 1901;
  }

  artTrackBy(index: number, art: Art) {
    return art.uid;
  }

  private async update(search: string | undefined) {
    this.arts = await this.db.findArts(search);
  }

  click(art: Art) {
    this.router.navigate(['/art/' + art.uid + '+Art']);
  }
}
