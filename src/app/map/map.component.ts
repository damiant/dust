import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { PinchZoomModule } from '@meddv/ngx-pinch-zoom';
import { LocationName } from '../models';

export interface MapPoint {
  street: string,
  clock: string
}

export function toMapPoint(location: string): MapPoint {
  if (!location) {
    return { street: '', clock: '' };
  }
  let l = location.toLowerCase();
  if (l.includes('open playa')) {
    console.error(`dont know how to location art: ${l}`);
    return { street: '', clock: '' };
  }
  if (l.includes('portal')) {
    l = l.replace('portal', '& esplanade');
  }
  if (l.includes('ring road')) {
    // eg rod's ring road @ 7:45
    l = '6:00 & c'; // TODO: be more accurate
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
      clock: tmp[0]?.trim()
    }
  } else {
    return {
      street: tmp[0]?.trim(),
      clock: tmp[1]?.trim()
    }
  }
}

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  imports: [PinchZoomModule, CommonModule],
  standalone: true
})
export class MapComponent implements OnInit, AfterViewInit {

  points: MapPoint[];
  src = 'assets/map.svg';
  @ViewChild('zoom') zoom!: ElementRef;
  @ViewChild('map') map!: ElementRef;
  @ViewChild('mapc') mapc!: ElementRef;
  @Input() height: string = 'height: 100%';
  @Input('points') set setPoints(points: MapPoint[]) {
    this.points = points;

  }

  ngAfterViewInit() {
    setTimeout(() => {
      for (let point of this.points) {        
        if (point.street !== '' && point.street.localeCompare(LocationName.Unavailable, undefined, { sensitivity: 'accent' })) {
          this.plot(this.toClock(point.clock), this.toStreetRadius(point.street));
        }
      }
    }, 150);
  }

  streets = [0.285, 0.338, 0.369, 0.405, 0.435, 0.465, 0.525, 0.557, 0.590, 0.621, 0.649, 0.678];
  constructor() {
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
      if (street == 'esplanade') {
        return this.streets[0];
      }
      return this.streets[c + 1];
    } catch {
      console.error(`Unable to find street ${street}`);
      return 0;
    }
  }

  // eg 2:45 => 2.75
  toClock(clock: string): number {
    const tmp = clock.split(':');
    const v = parseInt(tmp[1]) / 60.0; // eg 2:45 => 45/60 => 0.75
    return parseInt(tmp[0]) + v;
  }

  plot(clock: number, rad: number) {

    const radius = this.getCircleRadius();
    console.log('plot', clock, rad, radius);
    const pt = this.getPointOnCircle(rad * radius, this.clockToDegree(clock));
    pt.x += radius;
    pt.y += radius;
    const d = document.createElement("div");
    d.style.left = `${pt.x - 2}px`;
    d.style.top = `${pt.y - 5}px`;
    d.style.width = `5px`;
    d.style.height = `5px`;
    d.style.borderRadius = '5px';
    d.style.animationName = 'pulse';
    d.style.animationDuration = '1s';
    d.style.animationIterationCount = 'infinite';
    d.style.position = 'absolute';
    d.style.backgroundColor = `var(--ion-color-primary)`;
    const c: HTMLElement = this.mapc.nativeElement;
    c.insertBefore(d, c.firstChild);
    console.log(pt);
  }

  mapPoint(event: any) {
    const x = event.clientX;
    const y = event.clientY;
    const el: HTMLElement = this.map.nativeElement;
    const r = el.getBoundingClientRect();
    const rx = (x + r.x) / r.width;
    const ry = (y + r.y) / r.height;
    console.log(rx, ry, r);
  }

  clockToDegree(c: number): number {
    const r = 360 / 12;
    return (c - 3 % 12) * r;
  }

  getCircleRadius(): number {
    const el: HTMLElement = this.map.nativeElement;
    const r = el.getBoundingClientRect();
    return r.width / 2;
  }

  getPointOnCircle(radius: number, degree: number) {
    const radian = degree * Math.PI / 180;
    const x = radius * Math.cos(radian);
    const y = radius * Math.sin(radian);
    return { x, y };
  }
}
