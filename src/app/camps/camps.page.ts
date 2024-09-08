import { Component, effect, viewChild, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonText,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { Camp, MapPoint } from '../data/models';
import { DbService } from '../data/db.service';
import { CommonModule } from '@angular/common';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { MapModalComponent } from '../map-modal/map-modal.component';
import { CampComponent } from '../camp/camp.component';
import { SortComponent } from '../sort/sort.component';
import { UiService } from '../ui/ui.service';
import { SearchComponent } from '../search/search.component';
import { hasValue, isWhiteSpace, titlePlural } from '../utils/utils';
import { toMapPoint } from '../map/map.utils';
import { GeoService } from '../geolocation/geo.service';
import { GpsCoord } from '../map/geo.utils';
import { AlphabeticalScrollBarComponent } from '../alpha/alpha.component';
import { addIcons } from 'ionicons';
import { compass, compassOutline } from 'ionicons/icons';
import { CategoryComponent } from '../category/category.component';

interface CampsState {
  camps: Camp[];
  campType: string;
  campTypes: string[];
  showMap: boolean;
  title: string;
  mapTitle: string;
  mapSubtitle: string;
  noCampsMessage: string;
  mapPoints: MapPoint[];
  minBufferPx: number;
  alphaIndex: number[];
  alphaValues: string[];
  cardHeight: number;
  isScrollDisabled: boolean
  byDist: boolean;
  displayedDistMessage: boolean;
}

function initialState(): CampsState {
  return {
    camps: [],
    campTypes: [],
    campType: '',
    showMap: false,
    title: 'Camps',
    mapTitle: '',
    mapSubtitle: '',
    noCampsMessage: 'No camps were found.',
    mapPoints: [],
    minBufferPx: 900,
    cardHeight: 180,
    alphaIndex: [],
    alphaValues: [],
    byDist: false,
    isScrollDisabled: false,
    displayedDistMessage: false,
  };
}

@Component({
  selector: 'app-camps',
  templateUrl: 'camps.page.html',
  styleUrls: ['camps.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ScrollingModule,
    MapModalComponent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonText,
    IonIcon,
    IonBadge,
    CampComponent,
    SearchComponent,
    CategoryComponent,
    AlphabeticalScrollBarComponent,
    SortComponent,
  ],
})
export class CampsPage {
  public db = inject(DbService);
  private ui = inject(UiService);
  private toastController = inject(ToastController);
  private geo = inject(GeoService);
  private _change = inject(ChangeDetectorRef);
  vm: CampsState = initialState();
  virtualScroll = viewChild.required(CdkVirtualScrollViewport);

  constructor() {
    addIcons({ compass, compassOutline });
    effect(() => {
      this.ui.scrollUp('camps', this.virtualScroll());
    });
    effect(
      () => {
        const _year = this.db.selectedYear();
        this.db.checkInit();
        this.vm = initialState();
        this.update('');
      },
      { allowSignalWrites: true },
    );
  }

  home() {
    this.ui.home();
  }

  sortTypeChanged(e: string) {
    this.vm.byDist = e === 'dist';
    if (this.vm.byDist && !this.vm.displayedDistMessage) {
      this.ui.presentToast(`Displaying camps sorted by distance`, this.toastController);
      this.vm.displayedDistMessage = true;
    }
    this.ui.scrollUp('camps', this.virtualScroll());
    this.update('');
  }

  public categoryChanged() {
    this.vm.title = hasValue(this.vm.campType) ? titlePlural(this.vm.campType) : 'Camps';
    this.update('');
  }

  enableScroll() {
    this.vm.isScrollDisabled = false;
  }

  goToLetterGroup(e: string) {
    const idx = this.vm.alphaValues.indexOf(e);
    if (idx >= 0) {
      this.virtualScroll().scrollToIndex(this.vm.alphaIndex[idx]);
    }
  }

  async ionViewDidEnter() {
    // Hack to ensure tab view is updated on switch of tabs
    this.vm.minBufferPx = this.vm.minBufferPx == 901 ? 900 : 901;
    this.vm.cardHeight = 130 + this.ui.textZoom() * 50;
  }

  search(value: string) {
    this.virtualScroll().scrollToOffset(0);
    this.update(value);
  }

  campsTrackBy(index: number, camp: Camp) {
    return camp.uid;
  }

  map(camp: Camp) {
    this.vm.mapPoints = [toMapPoint(camp.location_string!, undefined, camp.pin)];
    this.vm.mapTitle = camp.name;
    this.vm.mapSubtitle = camp.location_string!;
    this.vm.showMap = true;
  }

  async update(search: string) {
    let coords: GpsCoord | undefined = undefined;
    if (this.vm.byDist) {
      coords = await this.geo.getPosition();
    }
    this.vm.camps = await this.db.findCamps(search, coords, undefined, this.vm.campType);
    this.vm.campTypes = await this.db.getCampTypes();
    this.updateAlphaIndex();
    this.vm.noCampsMessage = isWhiteSpace(search) ? `No camps were found.` : `No camps were found matching "${search}"`;
    this._change.markForCheck();
  }

  private updateAlphaIndex() {
    let lastChar = '';
    let idx = 0;
    this.vm.alphaIndex = [];
    this.vm.alphaValues = [];
    for (let camp of this.vm.camps) {
      if (camp.name.charAt(0) != lastChar) {
        lastChar = camp.name.charAt(0);
        this.vm.alphaIndex.push(idx);
        this.vm.alphaValues.push(lastChar);
      }
      idx++;
    }
  }
}
