import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonSpinner, IonList, IonItem, IonLabel, IonIcon, IonText, IonNote } from '@ionic/angular/standalone';
import { SearchComponent } from './search.component';
import { DbService } from '../data/db.service';
import { RouterModule } from '@angular/router';
import { MapSet, MapType } from '../data/models';
import { GeoService } from '../geolocation/geo.service';
import { GpsCoord } from '../map/geo.utils';
import { calculateRelativePosition, distance, formatDistanceNiceShort } from '../map/map.utils';

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
  imports: [IonText, IonIcon, IonLabel, IonItem, IonList, IonSpinner,
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonTitle,
    IonToolbar,
    IonNote,
    SearchComponent,
    CommonModule,
    RouterModule,
    FormsModule]
})
export class SearchPage {
  public vm: SearchState = { items: [], busy: false, gps: undefined };
  private db = inject(DbService);
  private geo = inject(GeoService);
  private _change = inject(ChangeDetectorRef);
  constructor() { }


  async ionViewDidEnter() {
    this.vm.gps = await this.geo.getPosition();
  }

  async search(value: string) {
    try {
      if (typeof value === 'object') {
        return;
      }


      if (value.trim() == '') {
        this.vm.items = [];
        return;
      }
      this.vm.busy = true;
      const items: SearchItem[] = [];
      const top = 20;
      const list = await this.db.findAll(value, undefined, '', this.vm.gps, undefined, true, true, top);
      items.push(...this.asSearchItems(list.camps, 'camp', 'assets/icon/camp.svg', this.vm.gps));
      items.push(...this.asSearchItems(list.art, 'art', 'assets/icon/art.svg', this.vm.gps));
      items.push(...this.asSearchItems(list.events, 'event', 'assets/icon/calendar.svg', this.vm.gps));
      items.push(...this.mapSetToSearchItems(list.restrooms, MapType.Restrooms, 'assets/icon/toilet.svg', this.vm.gps));
      items.push(...this.mapSetToSearchItems(list.medical, MapType.Medical, 'assets/icon/medical.svg', this.vm.gps));
      items.push(...this.mapSetToSearchItems(list.ice, MapType.Ice, 'assets/icon/ice.svg', this.vm.gps));
      items.sort((a: SearchItem, b: SearchItem) => {
        if (a.title.toLowerCase().includes(value.toLowerCase())) {
          return -1;
        }
        if (b.title.toLowerCase().includes(value.toLowerCase())) {
          return 1;
        }
        return 0;
      });
      this.vm.items = items;
    } finally {
      this.vm.busy = false;
      this._change.detectChanges();
    }
  }

  private mapSetToSearchItems(mapset: MapSet, linkName: string, icon: string, gps: GpsCoord | undefined): SearchItem[] {
    const r: SearchItem[] = [];
    for (const item of mapset.points) {
      if (item.gps) {
        const dist = this.dist(gps, item.gps);
        r.push({ title: mapset.title, icon, link: `/map/${linkName}`, dist })
      }
    }
    return r;
  }

  private asSearchItems(items: any[], linkName: string, icon: string, gps: GpsCoord | undefined): SearchItem[] {
    const r: SearchItem[] = [];
    for (const item of items) {
      let title = item.name ?? item.title;
      const dist = this.dist(gps, item.gpsCoords ?? item.gpsCoord);
      r.push({ title, icon, link: `/${linkName}/${item.uid}+Search`, dist })
    }
    return r;
  }

  private dist(gps: GpsCoord | undefined, pin: GpsCoord | undefined): string {
    if (gps && pin) {
      const dist = distance(gps, pin);
      if (dist > 4) {
        return '';
      }
      return calculateRelativePosition(gps, pin, this.geo.heading().trueHeading, true) +
        formatDistanceNiceShort(dist);
    }
    return '';
  }

}
