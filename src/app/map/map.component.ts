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
import { GpsCoord, Point } from './geo.utils';
import { Router, RouterModule } from '@angular/router';
import { environment } from 'src/environments/environment';
import { IonButton, IonContent, IonPopover, IonRouterOutlet, IonText } from '@ionic/angular/standalone';
import { CachedImgComponent } from '../cached-img/cached-img.component';

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
  private router = inject(Router);
  private settings = inject(SettingsService);
  _points: MapPoint[];
  isOpen = false;
  footer: string | undefined;
  popover = viewChild<any>('popover');
  info: MapInfo | undefined;
  src = 'assets/map.svg';
  showMessage = false;
  pointsSet = false;
  pins: Pin[] = [];
  divs: HTMLDivElement[] = [];
  private geoInterval: any;
  private nearestPoint: number | undefined;
  private you: HTMLDivElement | undefined;
  private watchId: any;
  private mapInformation: MapInformation | undefined;
  private compass: HTMLImageElement | undefined;
  private _viewReady = false;
  private selected: HTMLDivElement | undefined;
  private disabledMessage = 'Location is disabled';

  zoom = viewChild.required<ElementRef>('zoom');
  map = viewChild.required<ElementRef>('map');
  mapc = viewChild.required<ElementRef>('mapc');
  height = input<string>('height: 100%');
  routerOutlet: IonRouterOutlet = inject(IonRouterOutlet)
  footerPadding = input<number>(0);
  smallPins = input<boolean>(false);
  isHeader = input<boolean>(false);
  @Input() set points(points: MapPoint[]) {
    if (this.pointsSet) return;
    for (let div of this.divs) {
      div.remove();
    }
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
    await delay(150);
    this.update();
  }

  async locationClick() {
    if (this.settings.settings.locationEnabled === LocationEnabledStatus.Enabled) return;
    await this.geo.checkPermissions();
    if (this.geo.gpsPermission() == 'denied') {
      this.footer = 'Location services need to be enabled in settings on your device';
      return;
    }
    this.showMessage = true;
  }

  async enableGeoLocation(now: boolean) {
    console.log('enableGeoLocation', now);
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
    });
  }

  private async viewReady(): Promise<void> {
    while (!this._viewReady) {
      await delay(50);
    }
  }

  ngOnInit() {
    this.routerOutlet.swipeGesture = false;
    const darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.src = darkMode ? 'assets/map-dark.svg' : 'assets/map.svg';
    if (this.settings.settings.mapUri !== '') {
      this.src = this.settings.settings.mapUri;
    }
  }

  public triggerClick(pointIdx: number): boolean {
    try {
      const div = this.divs[pointIdx];
      div.style.animationName = `pulse`;
      div.style.animationDuration = '2s';
      div.click();
      if (this.selected) {
        // Deselect the previous selected
        this.selected.style.animationName = '';
        this.selected.style.animationDuration = '';
      }
      this.selected = div;
      return true;
    } catch (err) {
      console.error(`Error in triggerClick: ${err}`);
      return false;
    }
  }

  private async updateLocation() {
    await this.geo.getPosition();
  }

  private displayCompass(heading: CompassHeading) {
    if (!this.compass) {
      console.error(`Got compass heading but compass element is not defined`);
      return;
    }
    const rotation = this.settings.settings.mapRotation; // Note: Map may be rotated from North
    let degree = Math.trunc(heading.trueHeading) - rotation;
    if (degree < 0) {
      degree += 360;
    }
    this.compass.style.transform = `rotate(${degree}deg)`;
    this.compass.style.visibility = 'visible';
  }

  private async displayYourLocation(gpsCoord: GpsCoord) {
    //this.gpsCoord = await this.geo.getPosition();
    const pt = await this.geo.gpsToPoint(gpsCoord);
    if (!this.you) {
      // First time setup
      this.you = this.plotXY(pt.x, pt.y, youOffsetX, youOffsetY, undefined, 'var(--ion-color-secondary)');
      this.setupCompass(this.you);
      // Displays using cached value if available
      this.displayCompass(this.geo.heading());
    } else {
      const sz = parseInt(this.you.style.width.replace('px', ''));
      this.movePoint(this.you, this.pointShift(pt.x, pt.y, sz, youOffsetX, youOffsetY));
    }
    await this.calculateNearest(gpsCoord);
  }

  private setMapInformation() {
    const el: HTMLElement = this.map().nativeElement;
    const rect = el.getBoundingClientRect();
    this.mapInformation = {
      width: rect.width,
      height: rect.height,
      circleRadius: rect.width / 2,
    };
  }
  async update() {
    this.setMapInformation();
    this.divs = [];
    const blink = this.points.length == 1;
    for (let point of this._points) {
      const pin = mapPointToPin(point, defaultMapRadius);
      if (pin) {
        const div = this.plotXY(pin.x, pin.y, 6, 6, point.info, undefined, blink);
        this.divs.push(div);
      } else {
        console.error(`Point could not be converted to pin`);
      }
    }
    this._viewReady = true;
    await this.checkGeolocation();
  }

  private async checkGeolocation() {
    if (this.settings.settings.locationEnabled === LocationEnabledStatus.Unknown) {
      if (this.settings.shouldGeoAlert()) {
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

    const hasGeo = await this.geo.checkPermissions();
    if (!hasGeo) {
      if (this.settings.shouldGeoAlert()) {
        this.showMessage = true;
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
        const div = this.divs[this.nearestPoint];
        div.style.animationName = `pin`;
        div.style.animationDuration = '2s';
      }

      const prefix = this._points.length > 1 ? 'The closest is ' : '';
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


  private setupCompass(div: HTMLDivElement) {
    this.compass = this.createCompass(div);

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

  ngOnDestroy(): void {
    this.routerOutlet.swipeGesture = true;
    if (this.watchId) {
      (navigator as any).compass.clearWatch(this.watchId);
      this.watchId = undefined;
    }
    if (this.geoInterval) {
      clearInterval(this.geoInterval);
    }
  }

  private createCompass(div: HTMLDivElement) {
    let img = document.createElement('img');
    img.src = 'assets/icon/compass.svg';
    img.width = 10;
    img.style.position = 'absolute';
    img.style.padding = '1px';
    img.style.visibility = 'hidden';
    img.style.transition = '300ms linear all';
    div.appendChild(img);
    return img;
  }

  private compassError(error: CompassError) {
    console.error(error);
  }

  private pointShift(x: number, y: number, sz: number, ox: number, oy: number): Point {
    const px = (x / 10000.0) * this.mapInformation!.width;
    const py = (y / 10000.0) * this.mapInformation!.height;
    return { x: px - sz + ox, y: py - sz + oy };
  }

  private movePoint(div: HTMLDivElement, pt: Point) {
    div.style.left = `${pt.x}px`;
    div.style.top = `${pt.y}px`;
  }

  private plotXY(
    x: number,
    y: number,
    ox: number,
    oy: number,
    info?: MapInfo,
    bgColor?: string,
    blink?: boolean,
  ): HTMLDivElement {
    const sz = info || bgColor ? (this.smallPins() ? 8 : 10) : 8;
    if (info && info.location && !this.smallPins()!) {
      this.placeLabel(this.pointShift(x, y, 0, 0, -7), info);
    }
    if (info?.bgColor) {
      bgColor = info.bgColor;
    }
    return this.createPin(sz, this.pointShift(x, y, sz, ox + (this.smallPins() ? -2 : 0), oy), info, bgColor, blink);
  }

  createPin(sz: number, pt: Point, info?: MapInfo, bgColor?: string, blink?: boolean): HTMLDivElement {
    const d = document.createElement('div');
    d.style.left = `${pt.x}px`;
    d.style.top = `${pt.y}px`;
    d.style.width = `${sz}px`;
    d.style.height = `${sz}px`;
    d.style.border = '1px solid var(--ion-color-dark)';
    d.style.borderRadius = `${sz}px`;
    let anim = info ? '' : 'pulse';
    let animDuration = blink ? '1s' : '3s';
    if (blink) {
      anim = 'blink';
    }
    d.style.animationName = anim;
    if (anim !== '') {
      d.style.animationDuration = animDuration;
    }
    d.style.animationIterationCount = 'infinite';
    d.style.position = 'absolute';
    d.style.backgroundColor = bgColor ? bgColor : `var(--ion-color-primary)`;
    if (info) {
      d.onclick = (e) => {
        this.info = info;
        this.presentPopover(e);
      };
    }
    const c: HTMLElement = this.mapc().nativeElement;
    if (info?.label) {
      const p = document.createElement('p');
      const t = document.createTextNode(info?.label);
      p.style.margin = '0';
      p.style.marginTop = this.smallPins() ? '-3.5px' : '-3px';
      p.style.marginLeft = this.smallPins() ? '-8px' : '-7px';
      p.style.color = 'white';
      p.style.width = `22px`;
      p.style.textAlign = 'center';
      p.style.fontSize = this.smallPins() ? '10px' : '11px';
      p.style.fontWeight = 'bold';
      p.style.transform = 'scale(0.3)';
      p.appendChild(t);
      d.appendChild(p);
    }
    c.insertBefore(d, c.firstChild);
    return d;
  }

  private placeLabel(pt: Point, info?: MapInfo): HTMLDivElement {
    const d = document.createElement('p');
    const node = document.createTextNode(info!.location);
    d.appendChild(node);
    d.style.left = `${pt.x}px`;
    d.style.top = `${pt.y}px`;
    d.style.position = 'absolute';
    d.style.fontSize = '3px';
    d.style.borderRadius = '3px';
    d.style.color = `var(--ion-color-light)`;
    d.style.backgroundColor = `var(--ion-color-dark)`;
    d.onclick = (e) => {
      this.info = info;
      this.presentPopover(e);
    };
    const c: HTMLElement = this.mapc().nativeElement;
    c.insertBefore(d, c.firstChild);
    return d;
  }

  async presentPopover(e: Event) {
    this.popover().event = e;
    this.isOpen = true;
  }

  // This is used for clicking on the map and finding the corresponding x,y coordinates
  mapPoint(event: any) {
    const x = event.clientX;
    const y = event.clientY;
    const el: HTMLElement = this.map().nativeElement;
    const r = el.getBoundingClientRect();
    const rx = ((x - r.x) * 10000) / r.width;
    const ry = ((y - r.y) * 10000) / r.height;
    this.store(Math.ceil(rx), Math.ceil(ry));
    return false;
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
