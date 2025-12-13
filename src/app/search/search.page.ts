import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonSpinner,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonText,
  IonNote,
} from '@ionic/angular/standalone';
import { SearchComponent } from './search.component';
import { DbService } from '../data/db.service';
import { RouterModule } from '@angular/router';
import { MapSet, MapType } from '../data/models';
import { GeoService } from '../geolocation/geo.service';
import { GpsCoord } from '../map/geo.utils';
import { calculateRelativePosition, distance, formatDistanceNiceShort } from '../map/map.utils';
import { removeDiacritics } from '../utils/utils';

interface SearchItem {
  title: string;
  link: string;
  icon: string;
  dist: string;
}

interface SearchState {
  items: SearchItem[];
  busy: boolean;
  gps: GpsCoord | undefined;
}
@Component({
  selector: 'app-search-page',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonText,
    IonIcon,
    IonLabel,
    IonItem,
    IonList,
    IonSpinner,
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonTitle,
    IonToolbar,
    IonNote,
    SearchComponent,
    RouterModule,
    FormsModule
],
})
export class SearchPage {
  public vm: SearchState = { items: [], busy: false, gps: undefined };
  hasTerms = signal(false);
  private db = inject(DbService);
  private geo = inject(GeoService);
  private _change = inject(ChangeDetectorRef);

  constructor() {
    effect(async () => {
      if (!this.hasTerms()) {
        await this.updatePosition();
      }
    });
  }

  async ionViewDidEnter() {
    this.updatePosition();
  }

  private async updatePosition() {
    this.vm.gps = await this.geo.getPosition();
    if (this.vm.gps && this.vm.gps.lat == -1) {
      this.vm.gps = undefined;
    }
    if (this.vm.gps) {
      await this.search(undefined);
    }
  }

  async search(terms: string | undefined) {
    try {
      if (typeof terms === 'object') {
        return;
      }

      if (terms && terms.trim() == '') {
        this.vm.items = [];
        return;
      }
      this.vm.busy = true;
      const items: SearchItem[] = [];
      const top = terms ? 20 : 1;
      const list = await this.db.findAll(terms, undefined, '', this.vm.gps, undefined, true, true, top);
      items.push(...this.asSearchItems(list.camps, 'camp', 'assets/icon/camp.svg', this.vm.gps));
      items.push(...this.asSearchItems(list.art, 'art', 'assets/icon/art.svg', this.vm.gps));
      items.push(...this.asSearchItems(list.events, 'event', 'assets/icon/calendar.svg', this.vm.gps));
      items.push(
        ...this.mapSetToSearchItems(list.restrooms, MapType.Restrooms, 'assets/icon/toilet.svg', this.vm.gps, top),
      );
      items.push(
        ...this.mapSetToSearchItems(list.medical, MapType.Medical, 'assets/icon/medical.svg', this.vm.gps, top),
      );
      items.push(...this.mapSetToSearchItems(list.ice, MapType.Ice, 'assets/icon/ice.svg', this.vm.gps, top));
      if (terms) {
        const normalizedTerms = removeDiacritics(terms.toLowerCase());
        items.sort((a: SearchItem, b: SearchItem) => {
          if (removeDiacritics(a.title.toLowerCase()).includes(normalizedTerms)) {
            return -1;
          }
          if (removeDiacritics(b.title.toLowerCase()).includes(normalizedTerms)) {
            return 1;
          }
          return 0;
        });
      }
      this.vm.items = items;
      this.hasTerms.set(!!terms);
    } finally {
      this.vm.busy = false;
      this._change.detectChanges();
    }
  }

  private mapSetToSearchItems(
    mapset: MapSet,
    linkName: string,
    icon: string,
    gps: GpsCoord | undefined,
    top: number,
  ): SearchItem[] {
    const r: SearchItem[] = [];
    for (const item of mapset.points) {
      if (item.gps) {
        const dist = this.dist(gps, item.gps);
        r.push({ title: mapset.title, icon, link: `/map/${linkName}`, dist });
      }
      if (r.length >= top) {
        break;
      }
    }
    return r;
  }

  private asSearchItems(items: any[], linkName: string, icon: string, gps: GpsCoord | undefined): SearchItem[] {
    const r: SearchItem[] = [];
    for (const item of items) {
      let title = item.name ?? item.title;
      const dist = this.dist(gps, item.gpsCoords ?? item.gpsCoord);
      r.push({ title, icon, link: `/${linkName}/${item.uid}+Search`, dist });
    }
    return r;
  }

  private dist(gps: GpsCoord | undefined, pin: GpsCoord | undefined): string {
    if (gps && pin) {
      const dist = distance(gps, pin);
      if (dist > 4) {
        return '';
      }
      return calculateRelativePosition(gps, pin, this.geo.heading().trueHeading, true) + formatDistanceNiceShort(dist);
    }
    return '';
  }
}
