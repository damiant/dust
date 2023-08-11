import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { PinchZoomModule } from '@meddv/ngx-pinch-zoom';
import { LocationEnabledStatus, LocationName, MapInfo, MapPoint, Pin } from '../models';
import { IonicModule, PopoverController } from '@ionic/angular';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { getPoint, toClock, toRadius, toStreetRadius } from './map.utils';
import { compareStr, delay } from '../utils';
import { GeoService } from '../geo.service';
import { SettingsService } from '../settings.service';
import { MessageComponent } from '../message/message.component';

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
export class MapComponent implements OnInit, AfterViewInit {
  points: MapPoint[];
  isOpen = false;
  imageReady = false;
  @ViewChild('popover') popover: any;
  info: MapInfo | undefined;
  src = 'assets/map.svg';
  showMessage = false;
  pins: Pin[] = [];
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
    private popoverController: PopoverController,
    private geo: GeoService,
    private settings: SettingsService) {
    this.points = [];
  }

  ngOnInit() {
    const darkMode = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    this.src = darkMode ? 'assets/map-dark.svg' : 'assets/map.svg';
    // Plots every point
    // setTimeout(() => {
    //   for (let clock = 2; clock <= 10; clock += 0.25) {
    //     for (const street of this.streets) {
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
      if (point.x && point.y) {
        this.plotXY(point.x, point.y, point.info);
      } else if (point.street !== '' && compareStr(point.street, LocationName.Unavailable)) {
        this.plot(toClock(point.clock), toStreetRadius(point.street), undefined, point.info);
      } else if (point.feet) {
        if (point.streetOffset && point.clockOffset) {
          const offset = getPoint(toClock(point.clockOffset), toStreetRadius(point.streetOffset), this.mapInformation!.circleRadius);
          const center = getPoint(0, 0, this.mapInformation!.circleRadius);
          offset.x -= center.x;
          offset.y -= center.y;          
          this.plot(toClock(point.clock), toRadius(point.feet), offset, point.info);
        } else {
          this.plot(toClock(point.clock), toRadius(point.feet), undefined, point.info);
        }
      }
    }
    this.checkGeolocation();
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

    if (!await this.geo.checkPermissions()) {
      console.log('Show geolocation message');
      this.showMessage = true;
      return;
    }
    const gpsCoord = await this.geo.getPosition();
    //const gpsCoord = { lat: -119.21121456711064, lng: 40.780501492435846 }; // Center Camp
    console.log('checkGeolocation', gpsCoord);
    try {
      const pt = await this.geo.placeOnMap(gpsCoord, this.mapInformation!.circleRadius);
      this.createPin(pt.x, pt.y, 10, undefined, 'var(--ion-color-secondary)');
    } catch (err) {
      console.error('checkGeolocation.error', err);
    }

  }

  private plotXY(x: number, y: number, info?: MapInfo) {
    const px = x / 10000.0 * this.mapInformation!.width;
    const py = y / 10000.0 * this.mapInformation!.height;

    this.createPin(px, py, 5, info);

  }

  private plot(clock: number, rad: number, offset?: any, info?: MapInfo) {
    const pt = getPoint(clock, rad, this.mapInformation!.circleRadius);
    if (offset) {
      pt.x += offset.x;
      pt.y += offset.y;
    }
    if (info) {
      this.placeLabel(pt.x, pt.y, info);
    }
    this.createPin(pt.x, pt.y, info ? 10 : 5, info);

  }

  createPin(x: number, y: number, sz: number, info?: MapInfo, bgColor?: string) {
    console.log(x, y, sz, info)
    const d = document.createElement("div");
    d.style.left = `${x - (sz - 4)}px`;
    d.style.top = `${y - sz + 4}px`;
    d.style.width = `${sz}px`;
    d.style.height = `${sz}px`;
    d.style.border = '1px solid var(--ion-color-dark)';
    d.style.borderRadius = `${sz}px`;
    d.style.animationName = info ? '' : 'pulse';
    d.style.animationDuration = '1s';
    d.style.animationIterationCount = 'infinite';
    d.style.position = 'absolute';
    d.style.backgroundColor = bgColor ? bgColor : `var(--ion-color-primary)`;
    d.onclick = (e) => {
      this.info = info;

      console.log(this.info);
      this.presentPopover(e);
    };
    const c: HTMLElement = this.mapc.nativeElement;
    c.insertBefore(d, c.firstChild);
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

  mapPoint(event: any) {
    const x = event.clientX;
    const y = event.clientY;
    const el: HTMLElement = this.map.nativeElement;
    const r = el.getBoundingClientRect();
    const rx = (x - r.x) * 10000 / r.width;
    const ry = (y - r.y) * 10000 / r.height;
    //console.log('mappoint', rx, ry);
    this.store(Math.ceil(rx), Math.ceil(ry));
    return false;
  }

  store(x: number, y: number) {
    this.pins.push({ x, y });
    console.log(JSON.stringify(this.pins));
  }
}

