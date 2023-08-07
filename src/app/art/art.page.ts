import { Component, ViewChild, effect } from '@angular/core';
import { IonContent, IonicModule } from '@ionic/angular';
import { Art } from '../models';
import { DbService } from '../db.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ArtComponent } from './art.component';
import { UiService } from '../ui.service';
import { SearchComponent } from '../search/search.component';
import { Network } from '@capacitor/network';
import { NgxVirtualScrollModule } from '@lithiumjs/ngx-virtual-scroll';
import { SkeletonArtComponent } from '../skeleton-art/skeleton-art.component';

@Component({
  selector: 'app-arts',
  templateUrl: 'art.page.html',
  styleUrls: ['art.page.scss'],
  standalone: true,
  imports: [IonicModule, RouterLink, CommonModule, NgxVirtualScrollModule,
    ArtComponent, SearchComponent, SkeletonArtComponent],
})
export class ArtPage {
  showImage = false;
  public busy = true;
  arts: Art[] = [];

  @ViewChild(IonContent) ionContent!: IonContent;

  constructor(public db: DbService, private ui: UiService, private router: Router) {
    effect(() => {
      this.ui.scrollUpContent('art', this.ionContent);
    });
  }

  home() {
    this.ui.home();
  }

  async ionViewDidEnter() {
    if (this.arts.length > 0) return;
    try {
      this.busy = true;
      const status = await Network.getStatus();
      this.showImage = (status.connectionType == 'wifi');
      await this.update(undefined);
    } finally {
      this.busy = false;
    }
  }

  handleInput(event: any) {
    this.search(event.target.value);
  }

  search(val: string | undefined | null) {
    if (!val) return;
    this.ionContent.scrollToTop(100);
    console.log(`Search for art "${val}"`);
    this.update(val.toLowerCase());
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
