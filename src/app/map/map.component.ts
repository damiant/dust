import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, effect } from '@angular/core';
import { PinchZoomModule } from '@meddv/ngx-pinch-zoom';
import { LocationEnabledStatus, MapInfo, MapPoint, Pin } from '../data/models';
import { IonicModule } from '@ionic/angular';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { defaultMapRadius, distance, formatDistanceMiles, mapPointToPin } from './map.utils';
import { delay } from '../utils/utils';
import { GeoService } from '../geolocation/geo.service';
import { SettingsService } from '../data/settings.service';
import { MessageComponent } from '../message/message.component';
import { CompassError, CompassHeading } from './compass';
import { GpsCoord, NoGPSCoord, Point } from './geo.utils';

interface MapInformation {
  width: number; // Width of the map
  height: number; // Height of the map
  circleRadius: number; // Half width
}

// How often is the map updated with a new location
const geolocateInterval = 10000;

// Offset x,y in pixel of the "you are here" pin
const youOffsetX = - 4;
const youOffsetY = 4;

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  imports: [IonicModule, PinchZoomModule, CommonModule, MessageComponent],
  standalone: true,
  animations: [
    trigger('fade', [
      state('visible', style({ opacity: 1 })),
      state('hidden', style({ opacity: 0 })),
      transition('visible <=> hidden', animate('0.3s ease-in-out')),
    ])
  ]
})
export class MapComponent implements OnInit, OnDestroy {
  points: MapPoint[];
  isOpen = false;
  imageReady = false;
  footer: string | undefined;
  @ViewChild('popover') popover: any;
  info: MapInfo | undefined;
  src = 'assets/map.svg';
  showMessage = false;
  pins: Pin[] = [];
  private geoInterval: any;
  private gpsCoord: GpsCoord = NoGPSCoord();
  private you: HTMLDivElement | undefined;
  private watchId: any;
  private mapInformation: MapInformation | undefined;
  @ViewChild('zoom') zoom!: ElementRef;
  @ViewChild('map') map!: ElementRef;
  @ViewChild('mapc') mapc!: ElementRef;
  @Input() height: string = 'height: 100%';
  @Input() footerPadding: number = 0;
  @Input('points') set setPoints(points: MapPoint[]) {
    this.points = points;
    if (this.points.length > 0) {
      this.update();
    }
  }

  ready() {
    this.imageReady = true;
  }

  async enableGeoLocation() {
    if (await this.geo.getPermission()) {
      this.settings.settings.locationEnabled = LocationEnabledStatus.Enabled;
      this.settings.save();
      this.checkGeolocation();
    }
  }

  constructor(
    private geo: GeoService,
    private settings: SettingsService) {
    this.points = [];
  }

  ngOnInit() {
    const darkMode = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    this.src = darkMode ? 'assets/map-dark.svg' : 'assets/map.svg';
    //Plots every point
    // setTimeout(() => {
    //   for (let clock = 2; clock <= 10; clock += 0.25) {
    //     for (const street of streets) {
    //       this.plot(clock, street);
    //     }
    //   }
    // }, 2000);
  }

  private async displayYouAreHere() {
    this.gpsCoord = await this.geo.getPosition();
    const pt = await this.geo.gpsToPoint(this.gpsCoord, this.mapInformation!.circleRadius);
    if (!this.you) {
      this.you = this.plotXY(pt.x, pt.y, undefined, 'var(--ion-color-secondary)');
      this.setupCompass(this.you);
    } else {
      const sz = parseInt(this.you.style.width.replace('px', ''));

      this.movePoint(this.you, this.pointShift(pt.x, pt.y, sz, youOffsetX, youOffsetY));
    }
    this.calculateNearest(this.gpsCoord);
  }

  private setMapInformation() {
    const el: HTMLElement = this.map.nativeElement;
    const rect = el.getBoundingClientRect();
    this.mapInformation = {
      width: rect.width,
      height: rect.height,
      circleRadius: rect.width / 2
    }
  }
  async update() {
    await delay(150);
    this.setMapInformation();

    for (let point of this.points) {
      const pin = mapPointToPin(point, defaultMapRadius);
      if (pin) {
        const div = this.plotXY(pin.x, pin.y, point.info);
        (point as any).div = div;
      }
    }
    await this.checkGeolocation();

  }

  private async checkGeolocation() {
    if (this.settings.settings.locationEnabled === LocationEnabledStatus.Unknown) {
      this.showMessage = true;
      return;
    }
    if (this.settings.settings.locationEnabled === LocationEnabledStatus.Disabled) {
      console.log('Geolocation is disabled');
      return;
    }

    const hasGeo = await this.geo.checkPermissions();
    if (!hasGeo) {
      this.showMessage = true;
      return;
    }

    try {
      await this.displayYouAreHere();

      this.geoInterval = setInterval(async () => {
        await this.displayYouAreHere();
      }, geolocateInterval);
    } catch (err) {
      console.error('checkGeolocation.error', err);
    }
  }

  private calculateNearest(you: GpsCoord) {
    let least = 999999;
    let closest: MapPoint | undefined;
    for (let point of this.points) {
      if (!point.gps || !point.gps.lat) {
        console.error(`MapPoint is missing gps coordinate: ${JSON.stringify(point)}`);
      } else {
        const dist = distance(you, point.gps);
        if (dist < least) {
          least = dist;
          closest = point;
          console.log('*** found dist', dist, closest);
        }
      }
    }
    if (closest) {
      const div: HTMLDivElement = (closest as any).div;
      div.style.animationName = `pin`;
      div.style.animationDuration = '2s';
      const prefix = this.points.length > 1 ? 'The closest' : closest.info?.title;
      const dist = formatDistanceMiles(least);
      if (dist != '') {
        this.footer = `${prefix} is ${dist} away.`;
      } else {
        this.footer = ``;
        console.error(`Unable to find a close point`);
      }
    }
  }

  private setupCompass(div: HTMLDivElement) {
    const compass = this.createCompass(div);

    // Plugin is undefined on web
    if (!(navigator as any).compass) return;

    this.watchId = (navigator as any).compass.watchHeading(
      (heading: CompassHeading) => {
        // The 45 degrees here is based on the BM map that has North at 45 degrees.
        let degree = Math.trunc(heading.trueHeading) - 45;
        if (degree < 0) {
          degree += 360;
        }
        compass.style.transform = `rotate(${degree}deg)`;
        compass.style.visibility = 'visible';
      },
      this.compassError, { frequency: 1000 });
  }

  ngOnDestroy(): void {
    console.log('map component destroy')
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
    const px = x / 10000.0 * this.mapInformation!.width;
    const py = y / 10000.0 * this.mapInformation!.height;
    return { x: px - sz + ox, y: py - sz + oy };
  }

  private movePoint(div: HTMLDivElement, pt: Point) {
    div.style.left = `${pt.x}px`;
    div.style.top = `${pt.y}px`;
  }

  private plotXY(x: number, y: number, info?: MapInfo, bgColor?: string): HTMLDivElement {
    const sz = (info || bgColor) ? 10 : 5;
    if (info && info.location) {
      this.placeLabel(this.pointShift(x, y, 0, -7, -7), info);
    }
    return this.createPin(sz, this.pointShift(x, y, sz, youOffsetX, youOffsetY), info, bgColor);
  }



  createPin(sz: number, pt: Point, info?: MapInfo, bgColor?: string): HTMLDivElement {
    const d = document.createElement("div");
    d.style.left = `${pt.x}px`;
    d.style.top = `${pt.y}px`;
    d.style.width = `${sz}px`;
    d.style.height = `${sz}px`;
    d.style.border = '1px solid var(--ion-color-dark)';
    d.style.borderRadius = `${sz}px`;
    d.style.animationName = info ? '' : 'pulse';
    if (!info) {
      d.style.animationDuration = '3s';
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
    const c: HTMLElement = this.mapc.nativeElement;
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
    d.style.padding = '1px';
    d.style.borderRadius = '3px';
    d.style.color = `var(--ion-color-light)`;
    d.style.backgroundColor = `var(--ion-color-dark)`;
    d.onclick = (e) => {
      this.info = info;
      this.presentPopover(e);
    };
    const c: HTMLElement = this.mapc.nativeElement;
    c.insertBefore(d, c.firstChild);
    return d;
  }

  async presentPopover(e: Event) {
    this.popover.event = e;
    this.isOpen = true;
  }

  // This is used for clicking on the map and finding the corresponding x,y coordinates
  mapPoint(event: any) {
    const x = event.clientX;
    const y = event.clientY;
    const el: HTMLElement = this.map.nativeElement;
    const r = el.getBoundingClientRect();
    const rx = (x - r.x) * 10000 / r.width;
    const ry = (y - r.y) * 10000 / r.height;
    this.store(Math.ceil(rx), Math.ceil(ry));
    return false;
  }

  store(x: number, y: number) {
    this.pins.push({ x, y });
  }
}

