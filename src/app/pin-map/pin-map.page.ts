import { Component, Signal, WritableSignal, computed, signal, input, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MapComponent } from '../map/map.component';
import { DbService } from '../data/db.service';
import { Art, MapPoint, MapSet, MapType, Names } from '../data/models';
import { GpsCoord } from '../map/geo.utils';
import { GeoService } from '../geolocation/geo.service';
import { toMapPoint } from '../map/map.utils';
import { nowRange, timeRangeToString } from '../utils/utils';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonText,
  IonTitle,
  IonToolbar,
  IonSpinner,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { compassOutline } from 'ionicons/icons';
import { SearchComponent } from '../search/search.component';

@Component({
  selector: 'app-pin-map',
  templateUrl: './pin-map.page.html',
  styleUrls: ['./pin-map.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MapComponent,
    IonContent,
    IonHeader,
    IonItem,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonText,
    IonIcon,
    IonSpinner,
    SearchComponent
  ],
})
export class PinMapPage {
  private db = inject(DbService);
  private geo = inject(GeoService);
  mapType = input('');
  points: MapPoint[] = [];
  smallPins: boolean = false;
  showSearch: Signal<boolean> = computed(() => {
    return this.mapType() == MapType.All || this.mapType() == MapType.Art;
  });
  busy: Signal<boolean> = computed(() => {
    return this.geo.gpsBusy();
  });
  title: WritableSignal<string> = signal(' ');
  description = '';
  @ViewChild(MapComponent) map!: MapComponent;
  constructor() {
    addIcons({ compassOutline });
    this.db.checkInit();
  }

  async ionViewWillEnter() {
    const mapSet = await this.mapFor(this.mapType());
    this.points = mapSet.points;
    this.title.set(mapSet.title);
    this.description = mapSet.description;
  }

  public search(value: string) {
    if (value == '') return;
    let idx = 0;
    let found = -1;
    for (let p of this.points) {
      if (p.info) {
        if (p.info?.title.toLowerCase().includes(value.toLowerCase())) {
          found = idx;
        };
        if (p.info?.subtitle.toLowerCase().includes(value.toLowerCase())) {
          found = idx;
        };
      }
      idx++;
    }
    if (found != -1) {
      this.map.triggerClick(found);
    }

  }

  private async mapFor(mapType: string): Promise<MapSet> {
    switch (mapType) {
      case MapType.Art:
        return await this.getArt();
      case MapType.Now:
        return await this.getEventsNow();
      case MapType.Restrooms:
        return await this.fallback(await this.db.getGPSPoints(Names.restrooms, 'Block of restrooms'), 'Restrooms');
      case MapType.Ice:
        return await this.fallback(await this.db.getMapPoints(Names.ice), 'Ice');
      case MapType.Medical:
        return await this.fallback(await this.db.getMapPoints(Names.medical), 'Medical');
      case MapType.All:
        return await this.getAll();
      default:
        return { title: ' ', description: '', points: [] };
    }
  }

  private async fallback(mapSet: MapSet, pinType: string): Promise<MapSet> {
    this.title.set(pinType);
    if (mapSet.points.length > 0) return mapSet;
    return await this.db.getPins(pinType);
  }

  private async getArt(): Promise<MapSet> {
    const title = 'Art';
    this.title.set(title);
    let coords: GpsCoord | undefined = undefined;
    coords = await this.geo.getPosition();

    const allArt = await this.db.findArts(undefined, coords);
    const points = [];
    this.smallPins = allArt.length > 100;
    for (let art of allArt) {
      if (art.location_string || art.pin?.x) {
        const point = await this.convertToPoint(art);
        if (point) points.push(point);
      }
    }
    return {
      title,
      description: '',
      points,
    };
  }

  private async getAll(): Promise<MapSet> {
    let coords: GpsCoord | undefined = undefined;
    coords = await this.geo.getPosition();

    const camps = await this.db.findCamps('', coords);
    const points = [];


    for (let camp of camps) {
      if (camp.location_string || camp.pin?.x) {
        const point = toMapPoint(
          camp.location_string!,
          {
            title: camp.name,
            location: camp.location_string!,
            subtitle: '',
            imageUrl: camp.imageUrl,
            label: this.initials(camp.name, camp.label),
            href: '/camp/' + camp.uid + '+' + 'Map',
          },
          camp.pin,
        );
        if (point) points.push(point);
      }
    }

    for (let type of [Names.restrooms, Names.ice, Names.medical, Names.art]) {
      const map = await this.mapFor(type);
      map.points.forEach((point, index) => {
        if (!point.info) {
          const label = type == Names.restrooms ? '🧻' : undefined;
          point.info = { title: map.title, location: '', subtitle: `${index + 1} of ${map.points.length}`, label };
        }
        point.info.bgColor = this.colorOf(type);
      });
      points.push(...map.points);
    }
    this.title.set('Map');
    this.smallPins = points.length > 100;
    return {
      title: this.title(),
      description: '',
      points,
    };
  }

  private colorOf(type: string): string {
    switch (type) {
      case Names.restrooms:
        return 'var(--ion-color-secondary)';
      case Names.ice:
        return 'var(--ion-color-tertiary)';
      case Names.medical:
        return 'var(--ion-color-success)';
      case Names.art:
        return 'var(--ion-color-warning)';
      default:
        return 'var(--ion-color-primary)';
    }
  }

  private async convertToPoint(art: Art): Promise<MapPoint | undefined> {
    let point = toMapPoint(art.location_string!, undefined, art.pin);
    if (point.street == 'unplaced') return undefined;
    if (!art.location && !art.pin?.x) {
      console.error(`Bad art found`, art);
    }
    if (art.location?.gps_latitude && art.location?.gps_longitude) {
      const gps = { lng: art.location?.gps_longitude, lat: art.location?.gps_latitude };
      point = await this.db.gpsToMapPoint(gps, undefined);
    }
    point.info = {
      title: art.name,
      subtitle: '',
      location: '',
      label: this.initials(art.name, art.label),
      imageUrl: art.images && art.images[0] ? art.images[0].thumbnail_url : '',
      href: '/art/' + art.uid + '+' + this.title(),
    };
    return point;
  }

  private initials(name: string, defaultValue: string | undefined): string {
    if (defaultValue) return defaultValue;
    let inits = name.split(' ').map((s) => s.charAt(0)).join('');
    return inits.substring(0, 2).toUpperCase();
  }

  private async getEventsNow(): Promise<MapSet> {
    const title = 'Happening Now';
    this.title.set(title);
    const timeRange = nowRange(this.db.getTimeZone());
    //const timeRange = nowRange(localTimeZone());
    console.log('timeRange', timeRange);
    this.smallPins = true;
    const points = [];
    const allEvents = await this.db.findEvents('', undefined, '', undefined, timeRange, false, false);
    for (let event of allEvents) {
      const mapPoint = toMapPoint(
        event.location,
        {
          title: event.title,
          location: event.location,
          subtitle: event.camp,
          href: `event/${event.uid}+Now`,
        },
        event.pin,
      );
      mapPoint.gps = await this.db.getMapPointGPS(mapPoint);
      points.push(mapPoint);
    }
    return {
      title,
      description: `Map of ${allEvents.length} events happening ${timeRangeToString(timeRange, this.db.getTimeZone())}`,
      points,
    };
  }
}
