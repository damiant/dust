import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { PinchZoomModule } from '@meddv/ngx-pinch-zoom';
import { LocationName, MapInfo, MapPoint, Pin } from '../models';
import { IonicModule, PopoverController } from '@ionic/angular';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { clockToDegree, getPointOnCircle, toClock, toRadius, toStreetRadius } from './map.utils';
import { delay } from '../utils';
import { GeoService } from '../geo.service';
import { SettingsService } from '../settings.service';


@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  imports: [IonicModule, PinchZoomModule, CommonModule],
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
  pins: Pin[] = [];
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

  async update() {
    await delay(150);
    for (let point of this.points) {
      if (point.x && point.y) {
        this.plotXY(point.x, point.y, point.info);
      } else if (point.street !== '' && point.street?.localeCompare(LocationName.Unavailable, undefined, { sensitivity: 'accent' })) {
        this.plot(toClock(point.clock), toStreetRadius(point.street), undefined, point.info);
      } else if (point.feet) {
        if (point.streetOffset && point.clockOffset) {
          console.log('handle offset', point);
          const offset = this.getPoint(toClock(point.clockOffset), toStreetRadius(point.streetOffset));
          const center = this.getPoint(0, 0);
          offset.x -= center.x;
          offset.y -= center.y;
          console.log(offset)
          this.plot(toClock(point.clock), toRadius(point.feet), offset, point.info);
        } else {
          this.plot(toClock(point.clock), toRadius(point.feet), undefined, point.info);
        }
      }
    }
    this.checkGeolocation();    
  }

  private async checkGeolocation() {
    if (!this.settings.settings.locationEnabled) {
      return;
    }
    await this.geo.getPosition();
  }

  plotXY(x: number, y: number, info?: MapInfo) {
    const r = this.getMapRectangle();
    const px = x / 10000.0 * r.width;
    const py = y / 10000.0 * r.height;

    this.createPin(px, py, 5, info);

  }

  plot(clock: number, rad: number, offset?: any, info?: MapInfo) {
    const pt = this.getPoint(clock, rad);
    if (offset) {
      pt.x += offset.x;
      pt.y += offset.y;
    }
    if (info) {
      this.placeLabel(pt.x, pt.y, info);
    }
    this.createPin(pt.x, pt.y, info ? 10 : 5, info);

  }

  createPin(x: number, y: number, sz: number, info?: MapInfo) {
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
    d.style.backgroundColor = `var(--ion-color-primary)`;
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

  getPoint(clock: number, rad: number) {
    const radius = this.getCircleRadius();
    const pt = getPointOnCircle(rad * radius, clockToDegree(clock));
    pt.x += radius;
    pt.y += radius;
    return pt;
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

  private getCircleRadius(): number {
    return this.getMapRectangle().width / 2;
  }

  private getMapRectangle(): DOMRect {
    const el: HTMLElement = this.map.nativeElement;
    return el.getBoundingClientRect();
  }
}

