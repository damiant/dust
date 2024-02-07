import { Component, Input, Signal, WritableSignal, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MapComponent } from '../map/map.component';
import { DbService } from '../data/db.service';
import { Art, MapPoint, MapSet } from '../data/models';
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
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { compassOutline } from 'ionicons/icons';

enum MapType {
  Restrooms = 'restrooms',
  Ice = 'ice',
  Now = 'now',
  Art = 'art',
  Medical = 'medical',
}

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
    IonSpinner
  ],
})
export class PinMapPage {
  @Input() mapType = '';
  points: MapPoint[] = [];
  smallPins: boolean = false;
  busy: Signal<boolean> = computed(() => {
    return this.geo.gpsBusy();
  });
  title: WritableSignal<string> = signal(' ');
  description = '';
  constructor(
    private db: DbService,
    private geo: GeoService,
  ) {
    addIcons({ compassOutline });
    this.db.checkInit();
  }

  async ionViewWillEnter() {
    const mapSet = await this.mapFor(this.mapType);
    this.points = mapSet.points;
    this.title.set(mapSet.title);
    this.description = mapSet.description;
  }

  private async mapFor(mapType: string): Promise<MapSet> {
    switch (mapType) {
      case MapType.Art:
        return await this.getArt();
      case MapType.Now:
        return await this.getEventsNow();
      case MapType.Restrooms:
        return await this.fallback(await this.db.getGPSPoints('restrooms', 'Block of restrooms'), 'Restrooms');
      case MapType.Ice:
        return await this.fallback(await this.db.getMapPoints('ice'), 'Ice');
      case MapType.Medical:
        return await this.fallback(await this.db.getMapPoints('medical'), 'Medical');
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
    this.smallPins = true;
    coords = await this.geo.getPosition();

    const allArt = await this.db.findArts(undefined, coords);
    const points = [];
    for (let art of allArt) {
      if (art.location_string) {
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

  private async convertToPoint(art: Art): Promise<MapPoint | undefined> {
    let point = toMapPoint(art.location_string!);
    if (point.street == 'unplaced') return undefined;
    if (art.location.gps_latitude && art.location.gps_longitude) {
      const gps = { lng: art.location.gps_longitude, lat: art.location.gps_latitude };
      point = await this.db.gpsToMapPoint(gps, undefined);
    }
    point.info = {
      title: art.name,
      subtitle: '',
      location: '',
      imageUrl: art.images ? art.images[0].thumbnail_url : '',
    };
    return point;
  }

  private async getEventsNow(): Promise<MapSet> {
    const title = 'Happening Now';
    this.title.set(title)
    const timeRange = nowRange();
    this.smallPins = true;
    const points = [];
    const allEvents = await this.db.findEvents('', undefined, '', undefined, timeRange, false);
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
      description: `Map of ${allEvents.length} events happening ${timeRangeToString(timeRange)}`,
      points,
    };
  }
}
