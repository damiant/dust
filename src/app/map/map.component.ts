import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnDestroy, OnInit, effect, input, viewChild, inject } from '@angular/core';
import { PinchZoomModule } from '@meddv/ngx-pinch-zoom';
import { LocationEnabledStatus, MapInfo, MapPoint, Pin } from '../data/models';
import { defaultMapRadius, distance, formatDistanceMiles, mapPointToPin } from './map.utils';
import { delay } from '../utils/utils';
import { GeoService } from '../geolocation/geo.service';
import { SettingsService } from '../data/settings.service';
import { MessageComponent } from '../message/message.component';
import { CompassError, CompassHeading } from './compass';
import { GpsCoord } from './geo.utils';
import { Router, RouterModule } from '@angular/router';
import { environment } from 'src/environments/environment';
import { IonButton, IonContent, IonPopover, IonRouterOutlet, IonText } from '@ionic/angular/standalone';
import { CachedImgComponent } from '../cached-img/cached-img.component';
import { DbService } from '../data/db.service';
import { MapModel, MapResult } from './map-model';
import { init3D } from './map';

interface MapInformation {
  width: number; // Width of the map
  height: number; // Height of the map
  circleRadius: number; // Half width
}

// How often is the map updated with a new location
const geolocateInterval = 10000;

// Offset x,y in pixel of the "you are here" pin
const youOffsetX = 6;
const youOffsetY = 4;

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  imports: [
    PinchZoomModule,
    RouterModule,
    CommonModule,
    MessageComponent,
    IonPopover,
    IonContent,
    IonText,
    IonButton,
    CachedImgComponent,
    IonRouterOutlet
  ],
  standalone: true,
})
export class MapComponent implements OnInit, OnDestroy {
  private geo = inject(GeoService);
  private db = inject(DbService)
  private router = inject(Router);
  private settings = inject(SettingsService);
  _points: MapPoint[];
  isOpen = false;
  footer: string | undefined;
  popover = viewChild.required<ElementRef>('popover');
  info: MapInfo | undefined;
  src = 'assets/map.svg';
  showMessage = false;
  hideCompass = false;
  pointsSet = false;
  pins: Pin[] = [];
  private geoInterval: any;
  private nearestPoint: number | undefined;
  private watchId: any;
  private mapResult: MapResult | undefined;
  private _viewReady = false;
  private disabledMessage = 'Location is disabled';
  container = viewChild.required<ElementRef>('container');
  height = input<string>('height: 100%');
  routerOutlet: IonRouterOutlet = inject(IonRouterOutlet);
  footerPadding = input<number>(0);
  smallPins = input<boolean>(false);
  isHeader = input<boolean>(false);

  @Input() set points(points: MapPoint[]) {
    if (this.pointsSet) return;
    this._points = points;
    if (this._points.length > 0) {
      this.fixGPSAndUpdate();
      this.pointsSet = true;
    }
  }
  get points() {
    return this._points;
  }

  private async fixGPSAndUpdate() {
    for (let point of this._points) {
      if (!point.gps) {
        point.gps = await this.geo.getMapPointToGPS(point);
      }
    }
    this.hideCompass = !await this.db.hasGeoPoints();
    await delay(150);
    this.update();
  }

  async locationClick() {
    await this.geo.checkPermissions();
    if (this.geo.gpsPermission() == 'denied') {
      this.footer = 'Location services need to be enabled in settings on your device';
      return;
    }
    this.showMessage = true;
  }

  async enableGeoLocation(now: boolean) {
    if (now) {
      if (await this.geo.requestPermission()) {
        this.settings.settings.locationEnabled = LocationEnabledStatus.Enabled;
        this.settings.save();
        this.checkGeolocation();
      }
    } else {
      this.settings.setLastGeoAlert();
    }
  }

  constructor() {
    this._points = [];
    effect(async () => {
      const gpsPos = this.geo.gpsPosition();
      await this.viewReady();
      await this.displayYourLocation(gpsPos);
    });
    effect(async () => {
      const heading = this.geo.heading();
      await this.viewReady();
      this.displayCompass(heading);
    });
    effect(() => {
      const change = this.geo.gpsPermission();
      if (change !== 'denied' && this.footer == this.disabledMessage) {
        this.footer = '';
      }
      if (change === 'denied') {
        this.footer = this.disabledMessage;
      }
      if (change === 'none') {
        this.footer = undefined;
      }
    });
  }

  private async viewReady(): Promise<void> {
    while (!this._viewReady) {
      await delay(50);
    }
  }

  async ngOnInit() {
    this.routerOutlet.swipeGesture = false;
    const darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.src = darkMode ? 'assets/map-dark-2024.svg' : 'assets/map-2024.svg';
    const mapURI = await this.settings.getMapURI();
    if (mapURI !== undefined && mapURI !== '') {
      this.src = mapURI;
    }
  }

  // This is called when searching on the map
  public triggerClick(pointIdx: number) {
    this.pinClicked(`${pointIdx}`);
  }

  private async updateLocation() {
    await this.geo.getPosition();
  }

  private displayCompass(heading: CompassHeading) {
    const rotation = this.settings.settings.mapRotation; // Note: Map may be rotated from North
    let degree = Math.trunc(heading.trueHeading) - rotation;
    if (degree < 0) {
      degree += 360;
    }
    console.log(`Compass heading is ${degree}`);
    if (this.mapResult) {
      this.mapResult.rotateCompass(degree);
    }
    // this.compass.style.transform = `rotate(${degree}deg)`;
    // this.compass.style.visibility = this.hideCompass ? 'hidden' : 'visible';
  }

  private async displayYourLocation(gpsCoord: GpsCoord) {
    //this.gpsCoord = await this.geo.getPosition();
    const pt = await this.geo.gpsToPoint(gpsCoord);
    if (this.hideCompass) {
      pt.x -= 1000;
    }

    if (this.mapResult) {
      console.log('set my position', pt, gpsCoord);
      this.mapResult.myPosition(pt.x, pt.y);
    }

    await this.calculateNearest(gpsCoord);
  }

  private setMapInformation() {
    const el: HTMLElement = this.container().nativeElement;
    const rect = el.getBoundingClientRect();
    // this.mapInformation = {
    //   width: rect.width,
    //   height: rect.height,
    //   circleRadius: rect.width / 2,
    // };
  }
  async update() {
    this.setMapInformation();
    const map: MapModel = {
      image: this.src,// 'assets/map2.webp',
      width: 0,
      height: 0,
      defaultPinSize: 80,
      pins: [],
      compass: { uuid: 'compass', x: 1, z: 1, color: 'tertiary', size: 80, label: '' },
      pinClicked: this.pinClicked.bind(this),
    }

    const blink = this.points.length == 1;
    for (const [i, point] of this._points.entries()) {
      const pin = mapPointToPin(point, defaultMapRadius);

      if (pin) {
        map.pins.push({
          uuid: `${i}`,
          x: pin.x, z: pin.y,
          color: point.info?.bgColor ?? 'primary', animated: blink, size: map.defaultPinSize, label: point.info?.label ?? '+'
        });
      } else {
        console.error(`Point could not be converted to pin`);
      }
    }
    console.log('init3D', map)
    this.mapResult = await init3D(this.container().nativeElement, map);
    this._viewReady = true;
    await this.checkGeolocation();
    this.setupCompass();
  }

  private pinClicked(pinUUID: string, event?: PointerEvent) {
    const point = this._points[parseInt(pinUUID)];
    this.info = point?.info;
    //this.popover().event = event;
    //    this.popover().event = event;
    console.log('pinClicked', event);
    setTimeout(() => {
      this.isOpen = true;
    }, 100);
  }

  private async checkGeolocation() {
    if (this.settings.settings.locationEnabled === LocationEnabledStatus.Unknown) {
      if (this.settings.shouldGeoAlert() && !this.hideCompass) {
        this.showMessage = true;
      }
      return;
    }
    if (this.settings.settings.locationEnabled === LocationEnabledStatus.Disabled) {
      console.log('Geolocation is disabled');
      return;
    }

    if (!this.settings.shouldGeoAlert()) {
      return;
    }
    if (this.hideCompass) {
      return;
    }


    const hasGeo = await this.geo.checkPermissions();

    if (!hasGeo) {
      if (this.settings.shouldGeoAlert()) {
        if (await this.db.hasGeoPoints()) {
          this.showMessage = true;
        }
      }
      return;
    }

    try {
      // Used the cached location if available
      this.displayYourLocation(this.geo.gpsPosition());
      // This does not call await so that it will show immediately
      this.updateLocation();

      this.geoInterval = setInterval(async () => {
        await this.updateLocation();
      }, geolocateInterval);
    } catch (err) {
      console.error('checkGeolocation.error', err);
    }
  }

  private async calculateNearest(you: GpsCoord) {
    let least = 999999;
    let closest: MapPoint | undefined;
    let closestIdx = 0;
    let idx = 0;
    for (let point of this._points) {
      if (!point.gps || !point.gps.lat) {
        if (!environment.production) {
          console.error(`MapPoint is missing gps coordinate: ${JSON.stringify(point)}`);
        }
      }
      if (point.gps) {
        const dist = distance(you, point.gps);
        if (dist < least) {
          least = dist;
          closest = point;
          closestIdx = idx;
        }
      }
      idx++;
    }
    if (closest) {
      this.nearestPoint = closestIdx;

      if (this.nearestPoint) {
        if (this.mapResult) {
          this.mapResult.setNearest(closest.info?.label ?? ' ');
        }
      }

      if (this.hideCompass) {
        this.footer = ``;
        return;
      }
      const prefix = this._points.length > 1 ? 'Closest point is ' : '';
      const dist = formatDistanceMiles(least);
      if (least > 50) {
        if (this.settings.settings.locationEnabled === LocationEnabledStatus.Enabled) {
          this.footer = 'You are outside of the Event';
        } else {
          this.footer = this.disabledMessage;
        }
      } else {
        if (dist != '') {
          this.footer = `${prefix}${dist} away.`;
        } else {
          this.footer = ``;
          console.error(`Unable to find a close point`);
        }
      }
    }
  }


  private setupCompass() {
    // Plugin is undefined on web
    if (!(navigator as any).compass) return;

    this.watchId = (navigator as any).compass.watchHeading(
      (heading: CompassHeading) => {
        this.geo.heading.set(heading);
      },
      this.compassError,
      { frequency: 1000 },
    );
  }

  mapClick(event: MouseEvent) {
    this.isOpen = false;
    console.log('this.popover().nativeElement', this.popover().nativeElement);
    let left = event.clientX - 100;
    if (left < 0) { left = 0; }
    if (left + 200 > window.innerWidth) {
      left = window.innerWidth - 200;
    }
    let top = event.clientY;
    if (top + 300 > window.innerHeight) {
      top = window.innerHeight - 300;
      if (top < 0) { top = 0; }
    }
    this.popover().nativeElement.style.setProperty('left', `${left}px`);
    this.popover().nativeElement.style.setProperty('top', `${top}px`);
    console.log('mapClick', event);
  }

  popReady() {

  }

  ngOnDestroy(): void {
    this.routerOutlet.swipeGesture = true;
    if (this.watchId) {
      (navigator as any).compass.clearWatch(this.watchId);
      this.watchId = undefined;
    }
    if (this.geoInterval) {
      clearInterval(this.geoInterval);
    }
    if (this.mapResult) {
      this.mapResult.dispose();
    }
  }


  private compassError(error: CompassError) {
    console.error(error);
  }

  link(url: string | undefined) {
    if (!url) return;
    this.isOpen = false;
    setTimeout(() => {
      this.router.navigateByUrl(url);
    }, 500);
  }

  store(x: number, y: number) {
    this.pins.push({ x, y });
  }
}
