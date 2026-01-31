import { Component, effect, viewChild, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import {
  InfiniteScrollCustomEvent,
  IonBadge,
  IonButtons,
  IonContent,
  IonHeader,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonText,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { Art } from '../data/models';
import { DbService } from '../data/db.service';
import { Router } from '@angular/router';

import { ArtComponent, ArtImageStyle } from './art.component';
import { UiService } from '../ui/ui.service';
import { SearchComponent } from '../search/search.component';
import { SkeletonArtComponent } from '../skeleton-art/skeleton-art.component';
import { delay, hasValue, isWhiteSpace } from '../utils/utils';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { GpsCoord } from '../map/geo.utils';
import { GeoService } from '../geolocation/geo.service';
import { AlphabeticalScrollBarComponent } from '../alpha/alpha.component';
import { SortComponent } from '../sort/sort.component';
import { CategoryComponent } from '../category/category.component';

interface ArtState {
  imageStyle: ArtImageStyle;
  busy: boolean;
  noArtMessage: string;
  title: string;
  arts: Art[];
  artTypes: string[];
  artType: string;
  minBufferPx: number;
  byDist: boolean;
  cardHeight: number;
  alphaIndex: number[];
  alphaValues: string[];
  displayedDistMessage: boolean;
}

function initialState(): ArtState {
  return {
    imageStyle: 'none',
    busy: true,
    noArtMessage: 'No art was found',
    artTypes: [],
    artType: '',
    title: 'Art',
    arts: [],
    alphaIndex: [],
    alphaValues: [],
    minBufferPx: 1900,
    cardHeight: 180,
    byDist: false,
    displayedDistMessage: false,
  };
}

@Component({
  selector: 'app-arts',
  templateUrl: 'art.page.html',
  styleUrls: ['art.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ScrollingModule,
    IonButtons,
    AlphabeticalScrollBarComponent,
    IonContent,
    IonHeader,
    IonTitle,
    IonText,
    IonToolbar,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonBadge,
    ArtComponent,
    SearchComponent,
    SortComponent,
    CategoryComponent,
    SkeletonArtComponent,
  ],
})
export class ArtPage {
  public db = inject(DbService);
  private ui = inject(UiService);
  private router = inject(Router);
  private geo = inject(GeoService);
  private _change = inject(ChangeDetectorRef);
  private toastController = inject(ToastController);
  vm: ArtState = initialState();
  private allArt: Art[] = [];
  virtualScroll = viewChild.required(CdkVirtualScrollViewport);

  constructor() {
    effect(() => {
      this.ui.scrollUp('art', this.virtualScroll());
    });
    effect(() => {
      const _year = this.db.selectedYear();
      this.db.checkInit();
      this.vm = initialState();
      this.vm.imageStyle = 'top';
      this.calcCardHeight();
      this.init();
    });
  }

  isThisYear(): boolean {
    return this.db.selectedYear() == '';
  }

  home() {
    this.ui.home();
  }

  private calcCardHeight() {
    this.vm.cardHeight = (this.vm.imageStyle == 'top' ? 340 : 130) + this.ui.textZoom() * 50;
  }

  goToLetterGroup(e: string) {
    if (this.vm.arts.length < this.allArt.length) {
      this.addArt(this.allArt.length - this.vm.arts.length);
    }
    setTimeout(() => {
      const idx = this.vm.alphaValues.indexOf(e);
      if (idx >= 0) {
        this.virtualScroll().scrollToIndex(this.vm.alphaIndex[idx]);
      }
      this._change.markForCheck();
    }, 1);
  }

  async init() {
    try {
      this.vm.busy = true;
      await delay(100);
      await this.update(undefined);
    } finally {
      this.vm.busy = false;
      this._change.markForCheck();
    }
  }

  sortTypeChanged(e: string) {
    this.vm.byDist = e === 'dist';
    if (this.vm.byDist && !this.vm.displayedDistMessage) {
      this.ui.presentToast(`Displaying art sorted by distance`, this.toastController);
      this.vm.displayedDistMessage = true;
    }
    this.ui.scrollUp('art', this.virtualScroll());
    this.update('');
  }

  categoryChanged() {
    this.vm.title = hasValue(this.vm.artType) ? this.vm.artType : 'Art';
    this.ui.scrollUp('art', this.virtualScroll());
    this.update('');
  }

  async ionViewDidEnter() {
    this.hack();
    this._change.markForCheck();
  }

  onIonInfinite(ev: any) {
    this.addArt(10);
    setTimeout(() => {
      (ev as InfiniteScrollCustomEvent).target.complete();
      this._change.markForCheck();
    }, 10);
  }

  handleInput(event: any) {
    this.search(event.target.value);
  }

  search(val: string) {
    this.virtualScroll().scrollToOffset(0, 'smooth');
    this.vm.noArtMessage = isWhiteSpace(val) ? `No art were found.` : `No art were found matching "${val}"`;
    this.update(val.toLowerCase());
  }

  private hack() {
    // Hack to ensure tab view is updated on switch of tabs or when day is changed
    this.vm.minBufferPx = this.vm.minBufferPx == 1901 ? 1900 : 1901;
  }

  artTrackBy(index: number, art: Art) {
    return art.uid + `-${index}`;
  }

  private async update(search: string | undefined) {
    let coords: GpsCoord | undefined = undefined;
    if (this.vm.byDist) {
      coords = await this.geo.getPosition();
    }
    this.allArt = await this.db.findArts(search, coords, undefined, this.vm.artType);
    this.vm.artTypes = await this.db.getArtTypes();
    const count = this.allArt.filter((a) => a.images && a.images.length > 0).length;
    this.vm.imageStyle = count / this.allArt.length > 0.5 ? 'top' : 'side';
    this.calcCardHeight();
    this.vm.arts = [];
    this.addArt(10);
    this.updateAlphaIndex();
    this._change.detectChanges();
  }

  click(art: Art) {
    this.router.navigate(['/art/' + art.uid + '+Art']);
  }

  private addArt(count: number) {
    const chunk = this.allArt.slice(this.vm.arts.length, this.vm.arts.length + count);
    for (let item of chunk) {
      this.vm.arts.push(item);
    }
  }

  private updateAlphaIndex() {
    let lastChar = '';
    let idx = 0;
    this.vm.alphaIndex = [];
    this.vm.alphaValues = [];
    for (let art of this.allArt) {
      if (art.name.charAt(0) != lastChar) {
        lastChar = art.name.charAt(0);
        this.vm.alphaIndex.push(idx);
        this.vm.alphaValues.push(lastChar);
      }
      idx++;
    }
  }
}
