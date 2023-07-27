import { Component, ViewChild, effect } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Art } from '../models';
import { DbService } from '../db.service';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { ArtComponent } from './art.component';
import { UiService } from '../ui.service';

@Component({
  selector: 'app-arts',
  templateUrl: 'art.page.html',
  styleUrls: ['art.page.scss'],
  standalone: true,
  imports: [IonicModule, RouterLink, CommonModule, ScrollingModule, ArtComponent],
})
export class ArtPage {
  arts: Art[] = [];
  minBufferPx = 900;
  @ViewChild(CdkVirtualScrollViewport) virtualScroll!: CdkVirtualScrollViewport;

  constructor(private db: DbService, private ui: UiService) { 
    effect(() => {
      this.ui.scrollUp('art', this.virtualScroll);
    });
  }

  async ionViewDidEnter() {
    if (this.arts.length == 0) {
      this.update(undefined);
    } else {
      // Hack to ensure tab view is updated on switch of tabs
      this.minBufferPx = (this.minBufferPx == 901) ? 900: 901;      
      
    }
  }

  handleInput(event: any) {
    this.update(event.target.value.toLowerCase());
  }

  artTrackBy(index: number, art: Art) {    
    return art.uid;
  }

  async update(search: string | undefined) {
    this.arts = await this.db.findArts(search);
  }
}
