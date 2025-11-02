import {
  Component, Signal, WritableSignal, computed, signal, input, inject, ViewChild,
  effect, viewChild, ChangeDetectorRef, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MapComponent } from '../map/map.component';
import { DbService } from '../data/db.service';
import { Art, MapPoint, MapSet, MapType, Names, Pin } from '../data/models';
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
  IonIcon, IonButton, IonLoading
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { compassOutline, shareOutline } from 'ionicons/icons';
import { SearchComponent } from '../search/search.component';
import { PinColor } from '../map/map-model';
import { FavoritesService } from '../favs/favorites.service';
import { UiService } from '../ui/ui.service';
import { ToastController } from '@ionic/angular';
import { SettingsService } from '../data/settings.service';


@Component({
  selector: 'app-pin-map',
  templateUrl: './pin-map.page.html',
  styleUrls: ['./pin-map.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonLoading, IonButton,
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
    SearchComponent
  ]
})
export class PinMapPage {
  private db = inject(DbService);
  private ui = inject(UiService);
  private geo = inject(GeoService);
  private settings = inject(SettingsService);
  private favs = inject(FavoritesService);
  private toast = inject(ToastController);
  private location = inject(Location);
  mapComp = viewChild.required(MapComponent);
  _change = inject(ChangeDetectorRef);
  mapType = input('');
  thingName = input('');
  points: MapPoint[] = [];
  smallPins: boolean = false;
  isGettingGPS = false;
  canClearThing = false;
  clearLabel = 'Clear';
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
    addIcons({ compassOutline, shareOutline });
    this.db.checkInit();
    effect(async () => {
      const g = this.geo.gpsPosition();
      if (g.lat !== -1) {
        if (this.isGettingGPS) {
          this.isGettingGPS = false;
          this._change.markForCheck();
          await this.favs.setThingPosition(this.thingName(), g);
          this.ui.presentToast(`Saved location of ${this.thingName()}`, this.toast);
          this.location.back();
        }
      } else {
        console.error('gps is ', g)
      }
      this._change.markForCheck();
    });
    effect(async () => {
      const resumed = this.db.resume();
      if (resumed.length > 0 && this.mapType() === MapType.Now) {
        await this.refreshMap();
      }
    });
    effect(async () => {
      // Monitor mapType and thingName changes
      const mt = this.mapType();
      const tn = this.thingName();
      if (mt || tn) {
        await this.refreshMap();
      }
    });
  }

  async ionViewWillEnter() {
    await this.refreshMap();
  }

  private async refreshMap() {
    const mapSet = await this.mapFor(this.mapType());
    // Create a new array reference to trigger change detection
    this.points = [...mapSet.points];
    this.title.set(mapSet.title);
    this.description = mapSet.description;
    this._change.detectChanges();
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
        return await this.fallback(await this.db.getGPSPoints(Names.restrooms, 'Block of restrooms'), 'Restrooms', mapType);
      case MapType.Ice:
        return await this.fallback(await this.db.getMapPoints(Names.ice), 'Ice', mapType);
      case MapType.Medical:
        return await this.fallback(await this.db.getMapPoints(Names.medical), 'Medical', mapType);
      case MapType.Other:
        return await this.db.getPins(Names.other);
      case MapType.Things:
        return await this.getThings();
      case MapType.Friends:
        return await this.getFriends();
      case MapType.All:
        return await this.getAll();
      default:
        return { title: ' ', description: '', points: [] };
    }
  }

  private async fallback(mapSet: MapSet, pinType: string, mapType: string): Promise<MapSet> {
    this.title.set(pinType);
    this.applyMapType(mapType, mapSet);
    if (mapSet.points.length > 0) return mapSet;
    const ms = await this.db.getPins(pinType);
    this.applyMapType(mapType, ms);
    if (mapType == MapType.Restrooms) {
      this.exportForBM(ms);
    }
    return ms;
  }

  // Used to export restrooms placed on a test map and use it for Burning Man dataset
  private exportForBM(ms: MapSet) {
    const js = {
      "title": "Restrooms",
      "description": "Tip: At night, look for the blue light on poles marking porta potty banks.",
      "points": []
    };
    for (const pin of ms.points) {
      if (pin.gps) {
        (js.points as any).push({ lat: pin.gps.lat, lng: pin.gps.lng });
      }
    }
    // Uncomment to get data for export for burning man
    //console.log(JSON.stringify(js));
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


  private async getFriends(): Promise<MapSet> {
    const title = 'Friends';
    this.title.set(title);

    const favs = await this.favs.getFavorites();
    const friends = favs.friends;
    const points = [];
    this.smallPins = friends.length > 100;
    for (let friend of friends) {
      if (friend.address) {
        const point = await this.convertToPt(friend.name, friend.notes ?? '', friend.name, '', friend.address, '', undefined);
        if (point) points.push(point);
      }
    }
    if (friends.length === 0) {
      this.ui.presentToast(`You can add friends from the home page or from camp details.`, this.toast);
    }
    return {
      title,
      description: '',
      points,
    };
  }

  private async getThings(): Promise<MapSet> {
    const result: MapSet = { title: '', description: '', points: [{ street: '', clock: '' }] };
    result.title = this.thingName();
    for (let thing of this.favs.things()) {
      if (thing.name == this.thingName()) {
        if (!thing.gps) {
          console.log(`Location enabled when showing isGettingGPS`, this.settings.settings.locationEnabled);
          this.isGettingGPS = true;
        } else {
          this.canClearThing = true;

          this.clearLabel = ['My Camp', 'My Bike'].includes(this.thingName()) ?
            'Clear' : 'Delete';
        }
      }
      if (thing.gps) {
        const pt = await this.db.gpsToMapPoint(thing.gps, undefined);
        pt.animated = thing.name == this.thingName();
        pt.info = {
          title: thing.name,
          label: this.iconFor(thing.name),
          location: '',
          subtitle: `Saved ${this.since(thing.lastChanged)}. ${thing.notes}`
        };
        result.points.push(pt);
        console.log(`thing.${thing.name} is ${thing.gps.lat}, ${thing.gps.lng}. x=${pt.x}, y=${pt.y}`);
      }
    }

    return result;
  }

  private iconFor(name: string): string {
    if (name.includes('Camp')) return '-';
    if (name.includes('Bike')) return ':';

    return '^';
  }

  private since(v: number | undefined): string {
    if (!v) return '';
    const now = new Date().getTime();
    var differenceValue = (now - v) / 1000;
    differenceValue /= 60;
    const mins = Math.abs(Math.round(differenceValue));
    if (mins > 60) {
      const hrs = Math.round(mins / 60);
      return `${hrs} hr${hrs == 1 ? '' : 's'} ago`;
    }
    return `${mins} min${mins == 1 ? '' : 's'} ago`;
  }

  public async clearThing() {
    await this.favs.clearThing(this.thingName());
    this.ui.presentToast(`Removed ${this.thingName()}`, this.toast);
    this.location.back();
  }

  public async shareMap() {
    const img: string | undefined = await this.mapComp().capture();
    if (!img) return;
    await this.ui.shareFile({
      filename: `${this.title()}.png`,
      contentType: 'image/png',
      base64Data: img
    });
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
          camp.facing
        );
        if (point) points.push(point);
      }
    }

    const otherMaps = [Names.restrooms, Names.ice, Names.medical, Names.other];
    if (!this.db.artLocationsHidden()) {
      otherMaps.push(Names.art);
    }

    for (let type of otherMaps) {
      const map = await this.mapFor(type);
      this.applyMapType(type, map);
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

  private applyMapType(type: string, map: MapSet) {
    map.points.forEach((point, index) => {
      if (!point.info) {
        let label = undefined;
        switch (type) {
          case Names.restrooms: label = 'R'; break;
          case Names.ice: label = 'I'; break;
          case Names.medical: label = '+'; break;
        }
        point.info = { title: map.title, location: '', subtitle: `${index + 1} of ${map.points.length}`, label };
      }
      point.info.bgColor = this.colorOf(type, point.info.bgColor);
    });
  }

  private colorOf(type: string, defaultColor: PinColor | undefined): PinColor {
    switch (type) {
      case Names.restrooms:
        return 'tertiary';
      case Names.ice:
        return 'warning';
      case Names.medical:
        return 'medical';
      case Names.art:
        return 'secondary';
      case Names.other:
        return defaultColor ?? 'tertiary';
      default:
        return 'primary';
    }
  }

  private async convertToPoint(art: Art): Promise<MapPoint | undefined> {
    let point = toMapPoint(art.location_string!, undefined, art.pin);
    if (point.street == 'unplaced') return undefined;
    if (!art.location && !art.pin?.x && art.art_type !== 'Mutant Vehicle') {
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
      id: art.uid,
      imageUrl: art.images && art.images[0] ? art.images[0].thumbnail_url : '',
      href: '/art/' + art.uid + '+' + this.title(),
    };
    return point;
  }

  private async convertToPt(title: string, moreInfo: string, label: string, id: string, location_string: string, imageUrl: string, pin: Pin | undefined): Promise<MapPoint | undefined> {
    let point = toMapPoint(location_string, undefined, pin);
    if (point.street == 'unplaced') return undefined;
    point.info = {
      title,
      subtitle: '',
      location: moreInfo,
      label,
      id,
      imageUrl,
      href: undefined,
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
    this.smallPins = true;
    const points = [];
    const allEvents = await this.db.findEvents('', undefined, '', undefined, timeRange, true, false);
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
        event.facing
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
