import { ChangeDetectorRef, Component, ElementRef, inject, ViewChild } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { closeSharp } from 'ionicons/icons';
import { DbService } from '../data/db.service';
import { FavoritesService } from '../favs/favorites.service';
import { Art, Camp, Event, RSLEvent } from '../data/models';
import { delay } from '../utils/utils';
import { PrintWebview } from 'capacitor-print-webview';

interface PrintState {
  hide: boolean;
  music: RSLEvent[];
  events: Event[];
  camps: Camp[];
  art: Art[];
}

@Component({
    selector: 'app-print-favs',
    templateUrl: './print-favs.page.html',
    styleUrls: ['./print-favs.page.scss'],
    imports: [
        CommonModule, FormsModule
    ]
})
export class PrintFavsPage {
  private location = inject(Location);
  private db = inject(DbService);
  private fav = inject(FavoritesService);
  private _change = inject(ChangeDetectorRef);
  public vm: PrintState = { music: [], events: [], camps: [], art: [], hide: true };
  @ViewChild('printSection', { read: ElementRef }) printSection!: ElementRef;
  constructor() {
    addIcons({ closeSharp });
  }

  close() {
    this.vm.hide = true;
    this.location.back();
  }

  async ionViewDidEnter() {
    await this.init();
    this.print();
  }

  ionViewWillLeave() {
    this.vm.hide = true;
  }

  async init() {
    const favs = await this.fav.getFavorites();
    this.vm.music = await this.fav.getRSLEventList(favs.rslEvents);
    this.vm.events = await this.fav.getEventList(favs.events, this.db.isHistorical(), [], false)
    this.vm.camps = await this.db.getCampList(favs.camps);
    this.vm.art = await this.db.getArtList(favs.art);
    this.vm.hide = false;
    this._change.markForCheck();
  }

  async print() {
    await delay(500);
    await PrintWebview.print();
  }

}
