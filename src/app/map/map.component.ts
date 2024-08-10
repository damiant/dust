import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnDestroy, OnInit, effect, input, viewChild, inject, output, model } from '@angular/core';
import { LocationEnabledStatus, MapInfo, MapPoint, Pin } from '../data/models';
import { calculateRelativePosition, defaultMapRadius, distance, formatDistanceNice, mapPointToPin } from './map.utils';
import { delay } from '../utils/utils';
import { GeoService } from '../geolocation/geo.service';
import { SettingsService } from '../data/settings.service';
import { MessageComponent } from '../message/message.component';
import { CompassError, CompassHeading } from './compass';
import { GpsCoord } from './geo.utils';
import { Router, RouterModule } from '@angular/router';
import { environment } from 'src/environments/environment';
import { IonButton, IonContent, IonPopover, IonRouterOutlet, IonText, ToastController } from '@ionic/angular/standalone';
import { CachedImgComponent } from '../cached-img/cached-img.component';
import { DbService } from '../data/db.service';
import { MapModel, MapResult, ScrollResult } from './map-model';
import { init3D } from './map';
import { UiService } from '../ui/ui.service';

// How often is the map updated with a new location
const geolocateInterval = 10000;

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  imports: [
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
  private toastController = inject(ToastController);
  private ui = inject(UiService);
  _points: MapPoint[];
  isOpen = false;
  footer: string | undefined;
  footerClass: string | undefined;
  popover = viewChild.required<ElementRef>('popover');
  info: MapInfo | undefined;
  src = 'assets/map.svg';
  showMessage = false;
  hideCompass = false;
  pointsSet = false;
  mapClass = 'hidden';
  selectedPoint: MapPoint | undefined;
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
  loadingDialog = model<boolean>(false);
  wasLoadingDialog = false;
  scrolled = output<ScrollResult>();


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
    this.selectedPoint = undefined;
    let foundPoints = 0;
    for (let point of this._points) {
      if (!point.gps) {
        point.gps = await this.geo.getMapPointToGPS(point);
      }
      if (point.animated) {
        this.selectedPoint = point;
        foundPoints++;
      }
    }
    if (foundPoints > 1) {
      // Only select one point
      this.selectedPoint = undefined;
    }
    this.hideCompass = !await this.db.hasGeoPoints();
    await delay(150);
    this.update();
  }

  async locationClick() {
    await this.geo.checkPermissions();
    if (this.geo.gpsPermission() == 'denied') {
      this.ui.presentToast('Location services need to be enabled in settings on your device', this.toastController, undefined, 5000);
      return;
    }
    this.showMessage = true;
    this.hideLoadingDialog();
  }

  private hideLoadingDialog() {
    if (this.loadingDialog()) {
      this.wasLoadingDialog = true;
    }
    this.loadingDialog.set(false);
  }

  async enableGeoLocation(now: boolean) {
    if (this.wasLoadingDialog) {
      // Show the loading dialog again
      this.loadingDialog.set(true);
      this.wasLoadingDialog = false;
    }

    if (now) {
      if (await this.geo.requestPermission()) {
        this.settings.settings.locationEnabled = LocationEnabledStatus.Enabled;
        this.settings.save();
        this.checkGeolocation();
      } else {
        // User denied location so hide the loading dialog if shown
        if (this.loadingDialog()) {
          this.hideLoadingDialog();
        }
      }
    } else {
      if (this.loadingDialog()) {
        this.hideLoadingDialog();
      }
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
      this.footerClass = (this.footer == this.disabledMessage) ? 'warning' : '';
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
    this.mapResult?.pinSelected(`${pointIdx}`);

    this.popover().nativeElement.style.setProperty('left', `10px`);
    const y = this.container().nativeElement.top;
    this.popover().nativeElement.style.setProperty('top', `${y + 10}px`);
    const el: any = document.activeElement;
    if (el) {
      el.blur();
    }
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

    // Because the label shows left/right ahead we need to update the location
    this.displayYourLocation(this.geo.gpsPosition());
    if (this.mapResult) {
      this.mapResult.rotateCompass(degree);
    }
  }

  private async displayYourLocation(gpsCoord: GpsCoord) {
    const pt = await this.geo.gpsToPoint(gpsCoord);
    if (this.hideCompass) {
      pt.x -= 1000;
    }

    if (this.mapResult) {
      this.mapResult.myPosition(pt.x, pt.y);
    }

    await this.calculateNearest(gpsCoord, this.geo.heading());
  }

  private setMapInformation() {
    const el: HTMLElement = this.container().nativeElement;
    el.getBoundingClientRect();
  }
  async update() {
    this.mapClass = 'hidden';
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

    if (this.points.length == 1) {
      this.points[0].animated = true;
    }

    const largePins = this._points.length < 50;

    const size = largePins ? map.defaultPinSize : map.defaultPinSize / 1.8;
    for (const [i, point] of this._points.entries()) {
      const pin = mapPointToPin(point, defaultMapRadius);

      if (pin) {
        map.pins.push({
          uuid: `${i}`,
          x: pin.x, z: pin.y,
          color: point.info?.bgColor ?? 'primary',
          animated: point.animated,
          size,
          label: point.info?.label ?? '^'
        });
      } else {
        console.error(`Point could not be converted to pin`);
      }
    }

    this.mapResult = await init3D(this.container().nativeElement, map);
    this.mapResult.scrolled = (result: ScrollResult) => {
      this.scrolled.emit(result);
    }
    this._viewReady = true;
    this.mapClass = 'fade-in';
    await this.checkGeolocation();
    this.setupCompass();
  }

  // eslint-disable-next-line unused-imports/no-unused-vars
  private pinClicked(pinUUID: string, event?: PointerEvent) {
    const point = this._points[parseInt(pinUUID)];
    this.info = point?.info;
    //this.popover().event = event;
    //    this.popover().event = event;
    setTimeout(() => {
      this.isOpen = true;
    }, 100);
  }

  private async checkGeolocation() {
    if (this.settings.settings.locationEnabled === LocationEnabledStatus.Unknown) {
      if (this.settings.shouldGeoAlert() && !this.hideCompass) {
        this.showMessage = true;
        this.hideLoadingDialog();
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
          this.hideLoadingDialog();
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

  private async calculateNearest(you: GpsCoord, compass: CompassHeading) {
    let least = 999999;
    let closest: MapPoint | undefined;
    let closestIdx = 0;
    let name = 'Closest point';
    let idx = 0;
    for (let point of this.selectedPoint ? [this.selectedPoint] : this._points) {
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
          name = point.info?.title.replace('My ', 'Your ') ?? '';
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
      const prefix = this._points.length > 1 ? `${name} is ` : '';
      const dist = formatDistanceNice(least);
      if (least > 50) {
        if (this.settings.settings.locationEnabled === LocationEnabledStatus.Enabled) {
          this.footer = (you.lat == 0) ? 'Calculating location' : 'You are outside of the Event';
        } else {
          this.footer = this.disabledMessage;
          this.footerClass = 'warning';
        }
      } else {
        if (dist != '') {
          const direction = closest.gps ? calculateRelativePosition(you, closest.gps, compass.trueHeading) : 'away';
          this.footer = `${prefix}${dist} ${direction}`;
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

  closePopover() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.mapResult?.pinUnselected();
  }

  mapClick(event: MouseEvent) {
    this.closePopover();
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
    this.closePopover();
    setTimeout(() => {
      this.router.navigateByUrl(url);
    }, 500);
  }

  store(x: number, y: number) {
    this.pins.push({ x, y });
  }
}
