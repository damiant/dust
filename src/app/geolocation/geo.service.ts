import { Injectable, signal, inject } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { GpsCoord, NoGPSCoord, Point, timeStampGPS } from '../map/geo.utils';
import { DbService } from '../data/db.service';
import { environment } from 'src/environments/environment';
import { Capacitor } from '@capacitor/core';
import { noDate, secondsBetween } from '../utils/utils';
import { toMapPoint } from '../map/map.utils';
import { CompassHeading } from '../map/compass';
import { LocationEnabledStatus, MapPoint } from '../data/models';
import { SettingsService } from '../data/settings.service';

@Injectable({
  providedIn: 'root',
})
export class GeoService {
  private db = inject(DbService);
  private settings = inject(SettingsService);
  public gpsPermission = signal('');
  public gpsPosition = signal(NoGPSCoord());
  public heading = signal(this.noCompassHeading());
  public gpsBusy = signal(false);
  private lastGpsUpdate: Date = noDate();
  private hasPermission = false;
  private centerOfMap: GpsCoord | undefined;
  // Returns true if you are granted permission
  public hasShownGeolocationMessage = false;
  public async checkPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return true;
    }

    if (!(await this.db.hasGeoPoints())) {
      this.gpsPermission.set('none');
      return false;
    }
    const status = await Geolocation.checkPermissions();

    this.gpsPermission.set(status.location);

    return status.location == 'granted' || status.coarseLocation == 'granted';
  }

  public async requestPermission(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return true;
    }
    if (!(await this.db.hasGeoPoints())) {
      this.gpsPermission.set('none');
      return false;
    }

    const status = await Geolocation.requestPermissions({ permissions: ['location'] });
    this.gpsPermission.set(status.location);
    return status.location == 'granted';
  }

  public async getCenterOfMap(): Promise<GpsCoord> {
    if (!this.centerOfMap) {
      const center = toMapPoint(`10:25 0', Open Playa`);
      this.centerOfMap = await this.db.getMapPointGPS(center);
    }
    return this.centerOfMap;
  }

  private noCompassHeading(): CompassHeading {
    return {
      magneticHeading: 0,
      trueHeading: 0,
      timestamp: new Date().getTime(),
      headingAccuracy: 0,
    };
  }

  public async getMapPointToGPS(mp: MapPoint): Promise<GpsCoord> {
    return await this.db.getMapPointGPS(mp);
  }

  public async getPosition(): Promise<GpsCoord> {
    if (!Capacitor.isNativePlatform() || environment.gps) {
      console.error(`On web we return the coord of center camp`);
      this.gpsPosition.set({ lng: -119.21121456711064, lat: 40.780501492435846, timeStamp: new Date().getTime() });
      return this.gpsPosition();
    }

    if (
      (!this.settings.shouldGeoAlert() && this.settings.settings.locationEnabled !== LocationEnabledStatus.Enabled) ||
      !(await this.db.hasGeoPoints())
    ) {
      this.gpsPosition.set(NoGPSCoord());
      return NoGPSCoord();
    }
    console.time('geo.permissions');
    if (!this.hasPermission) {
      if (!(await this.checkPermissions())) {
        if (this.settings.shouldGeoAlert()) {
          console.error(`User not accepted geolocation yet.`);
          this.gpsPosition.set(NoGPSCoord());
          return NoGPSCoord();
        }
        console.error(`Requesting permissions.`);
        if (!(await this.requestPermission())) {
          console.error(`User geolocation permission denied.`);
          this.settings.settings.locationEnabled = LocationEnabledStatus.Disabled;
          this.settings.save();
          this.gpsPosition.set(NoGPSCoord());
          return NoGPSCoord();
        }
      }
    }

    console.timeEnd('geo.permissions');

    if (secondsBetween(this.lastGpsUpdate, new Date()) < 10) {
      return this.gpsPosition();
    }

    this.gpsBusy.set(true);

    if (environment.gps) {
      console.error(`Fake GPS position was returned ${environment.gps}`);
      setTimeout(() => {
        if (environment.gps) {
          this.gpsPosition.set({ lat: environment.gps.lat, lng: environment.gps.lng, timeStamp: new Date().getTime() });
        }
      }, 3000);
      return this.gpsPosition(); // Return a fake location
    }
    Geolocation.getCurrentPosition({ enableHighAccuracy: true }).then((position) => {
      this.gpsBusy.set(false);
      let gps = { lat: position.coords.latitude, lng: position.coords.longitude };
      gps = this.db.offsetGPS(gps);
      this.lastGpsUpdate = new Date();
      this.gpsPosition.set(timeStampGPS(gps));
      this.hasPermission = true;
    });
    return this.gpsPosition();
  }

  public async gpsToPoint(coord: GpsCoord): Promise<Point> {
    return await this.db.gpsToPoint(coord);
  }

  public resetPosition(): void {
    this.lastGpsUpdate = noDate();
  }
}
