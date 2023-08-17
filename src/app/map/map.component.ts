import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { PinchZoomModule } from '@meddv/ngx-pinch-zoom';
import { LocationEnabledStatus, MapInfo, MapPoint, Pin } from '../data/models';
import { IonicModule } from '@ionic/angular';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { mapPointToPin } from './map.utils';
import { delay } from '../utils/utils';
import { GeoService } from '../geolocation/geo.service';
import { SettingsService } from '../data/settings.service';
import { MessageComponent } from '../message/message.component';
import { CompassError, CompassHeading } from './compass';

interface MapInformation {
  width: number; // Width of the map
  height: number; // Height of the map
  circleRadius: number; // Half width
}

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
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  points: MapPoint[];
  isOpen = false;
  imageReady = false;
  @ViewChild('popover') popover: any;
  info: MapInfo | undefined;
  src = 'assets/map.svg';
  showMessage = false;
  pins: Pin[] = [];
  private watchId: any;
  private mapInformation: MapInformation | undefined;
  @ViewChild('zoom') zoom!: ElementRef;
  @ViewChild('map') map!: ElementRef;
  @ViewChild('mapc') mapc!: ElementRef;
  @Input() height: string = 'height: 100%';
  @Input('points') set setPoints(points: MapPoint[]) {
    this.points = points;
    if (this.points.length > 0) {
      this.update();
    }
  }

  ngAfterContentInit() {
  }

  ngAfterViewInit() {
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
      const pin = mapPointToPin(point, 5000);// this.mapInformation!.circleRadius);
      console.log('map', pin, point);
      if (pin) {
        this.plotXY(pin.x, pin.y, point.info);
      }
    }
    await this.checkGeolocation();

  }

  private async checkGeolocation() {
    if (this.settings.settings.locationEnabled === LocationEnabledStatus.Unknown) {
      console.log('Show geolocation message');
      this.showMessage = true;
      return;
    }
    if (this.settings.settings.locationEnabled === LocationEnabledStatus.Disabled) {
      console.log('Geolocation is disabled');
      return;
    }

    const hasGeo = await this.geo.checkPermissions();
    if (!hasGeo) {
      console.log('Show geolocation message');
      this.showMessage = true;
      return;
    }

    try {
      const gpsCoord = await this.geo.getPosition();
        const pt = await this.geo.placeOnMap(gpsCoord, this.mapInformation!.circleRadius);        
        const div = this.plotXY(pt.x, pt.y, undefined, 'var(--ion-color-secondary)');
        this.checkCompass(div);
    } catch (err) {
      console.error('checkGeolocation.error', err);
    }
  }

  private checkCompass(div: HTMLDivElement) {
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
    if (this.watchId) {
      (navigator as any).compass.clearWatch(this.watchId);
      this.watchId = undefined;
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

  private plotXY(x: number, y: number, info?: MapInfo, bgColor?: string): HTMLDivElement {
    const px = x / 10000.0 * this.mapInformation!.width;
    const py = y / 10000.0 * this.mapInformation!.height;
    if (info && info.location) {
      this.placeLabel(px, py, info);
    }
    return this.createPin(px, py, (info || bgColor) ? 10 : 5, info, bgColor);
  }

  createPin(x: number, y: number, sz: number, info?: MapInfo, bgColor?: string): HTMLDivElement {
    const d = document.createElement("div");
    d.style.left = `${x - (sz - 4)}px`;
    d.style.top = `${y - sz + 4}px`;
    d.style.width = `${sz}px`;
    d.style.height = `${sz}px`;
    d.style.border = '1px solid var(--ion-color-dark)';
    d.style.borderRadius = `${sz}px`;
    d.style.animationName = info ? '' : 'pulse';
    d.style.animationDuration = '3s';
    d.style.animationIterationCount = 'infinite';
    d.style.position = 'absolute';
    d.style.backgroundColor = bgColor ? bgColor : `var(--ion-color-primary)`;
    d.onclick = (e) => {
      this.info = info;
      this.presentPopover(e);
    };
    const c: HTMLElement = this.mapc.nativeElement;
    c.insertBefore(d, c.firstChild);
    return d;
  }

  private placeLabel(x: number, y: number, info?: MapInfo) {
    const d = document.createElement('p');
    const node = document.createTextNode(info!.location);
    d.appendChild(node);
    d.style.left = `${x}px`;
    d.style.top = `${y - 7}px`;
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

