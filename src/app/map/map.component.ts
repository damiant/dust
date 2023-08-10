import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { PinchZoomModule } from '@meddv/ngx-pinch-zoom';
import { LocationName, MapInfo, MapPoint, Pin } from '../models';
import { IonicModule, PopoverController } from '@ionic/angular';
import { animate, state, style, transition, trigger } from '@angular/animations';

export function toMapPoint(location: string | undefined, info?: MapInfo): MapPoint {
  if (!location) {
    return { street: '', clock: '' };
  }
  let l = location.toLowerCase();
  if (l.includes('ring road')) {
    // eg rod's ring road @ 7:45
    return convertRods(l, info);
  }
  if (l.includes('open playa') || l.includes(`'`)) {
    return convertArt(l, info);
  }
  if (l.includes('portal')) {
    l = l.replace('portal', '& esplanade');
  }
  if (l.includes('center camp plaza')) {
    l = '6:00 & A';
  } else if (l.includes('plaza')) {
    // 9:00 B Plaza
    l = l.replace('plaza', '');
    l = l.replace(' ', ' & ');

  }
  const tmp = l.split('&');
  if (tmp[0].includes(':')) {
    return {
      street: tmp[1]?.trim(),
      clock: tmp[0]?.trim(),
      info
    }
  } else {
    return {
      street: tmp[0]?.trim(),
      clock: tmp[1]?.trim(),
      info
    }
  }
}

function convertArt(l: string, info?: MapInfo): MapPoint {
  const tmp = l.split(' ');
  const clock = tmp[0].trim();
  const feet = parseInt(tmp[1].trim().replace(`'`, ''));
  return { street: '', clock, feet, info };
}

function convertRods(l: string, info?: MapInfo): MapPoint {
  if (l.includes('&')) {
    // May be rod's ring road & D
    return { street: 'd', clock: '6:00', info };
  }
  const tmp = l.split('@');
  const clock = tmp[1].trim();
  return { street: '', clock, feet: 650, streetOffset: 'b', clockOffset: '6:00' };
}

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

  update() {
    setTimeout(() => {
      for (let point of this.points) {
        if (point.x && point.y) {
          this.plotXY(point.x, point.y, point.info);
        } else if (point.street !== '' && point.street?.localeCompare(LocationName.Unavailable, undefined, { sensitivity: 'accent' })) {
          this.plot(this.toClock(point.clock), this.toStreetRadius(point.street), undefined, point.info);
        } else if (point.feet) {
          if (point.streetOffset && point.clockOffset) {
            console.log('handle offset', point);
            const offset = this.getPoint(this.toClock(point.clockOffset), this.toStreetRadius(point.streetOffset));
            const center = this.getPoint(0, 0);
            offset.x -= center.x;
            offset.y -= center.y;
            console.log(offset)
            this.plot(this.toClock(point.clock), this.toRadius(point.feet), offset, point.info);
          } else {
            this.plot(this.toClock(point.clock), this.toRadius(point.feet), undefined, point.info);
          }
        }
      }
    }, 150);
  }

  ngAfterViewInit() {
  }

  ready() {
    this.imageReady = true;
  }

  streets = [0.285, 0.338, 0.369, 0.405, 0.435, 0.465, 0.525, 0.557, 0.590, 0.621, 0.649, 0.678];
  constructor(private popoverController: PopoverController) {
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

  toStreetRadius(street: string): number {
    try {
      const acode = 'a'.charCodeAt(0);
      const c = street.toLowerCase().charCodeAt(0) - acode;
      
      if (street.toLowerCase() == 'esplanade') {
        return this.streets[0];
      }
      return this.streets[c + 1];
    } catch {
      console.error(`Unable to find street ${street}`);
      return 0;
    }
  }

  toRadius(feet: number): number {
    // 2500ft from man to espanade
    const toEspanade = this.streets[0];
    const pixels = feet / 2500.0 * toEspanade;
    return pixels;

  }

  // eg 2:45 => 2.75
  toClock(clock: string): number {
    const tmp = clock.split(':');
    const v = parseInt(tmp[1]) / 60.0; // eg 2:45 => 45/60 => 0.75
    return parseInt(tmp[0]) + v;
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
    console.log(x,y,sz,info)
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
    d.style.top = `${y-7}px`;
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
    const pt = this.getPointOnCircle(rad * radius, this.clockToDegree(clock));
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

  clockToDegree(c: number): number {
    const r = 360 / 12;
    return (c - 3 % 12) * r;
  }

  getCircleRadius(): number {
    return this.getMapRectangle().width / 2;
  }

  getMapRectangle(): DOMRect {
    const el: HTMLElement = this.map.nativeElement;
    return el.getBoundingClientRect();
  }

  getPointOnCircle(radius: number, degree: number) {
    const radian = degree * Math.PI / 180;
    const x = radius * Math.cos(radian);
    const y = radius * Math.sin(radian);
    return { x, y };
  }
}
