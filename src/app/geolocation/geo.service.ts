import { Injectable, signal } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { GpsCoord, NoGPSCoord, Point } from '../map/geo.utils';
import { DbService } from '../data/db.service';
import { environment } from 'src/environments/environment';
import { Capacitor } from '@capacitor/core';
import { noDate, secondsBetween } from '../utils/utils';

@Injectable({
  providedIn: 'root'
})
export class GeoService {
  private gpsPosition = signal(NoGPSCoord());
  private lastGpsUpdate: Date = noDate();
  private hasPermission = false;

  constructor(private db: DbService) { }

  // Returns true if you are granted permission
  public async checkPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return true;
    }
    const status = await Geolocation.checkPermissions();
    console.log(status);
    return (status.location == 'granted' || status.coarseLocation == 'granted');
  }

  public async getPermission(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return true;
    }
    const status = await Geolocation.requestPermissions({ permissions: ['location'] });
    return (status.location == 'granted');
  }

  public async getPosition(): Promise<GpsCoord> {
    if (!Capacitor.isNativePlatform()) {
      console.error(`On web we return the coord of center camp`);
      this.gpsPosition.set({ lng: -119.21121456711064, lat: 40.780501492435846 });
      return this.gpsPosition();
    }

    console.time('geo.permissions');
    if (!this.hasPermission) {
      if (!await this.checkPermissions()) {
        if (!await this.getPermission()) {
          console.error(`User geolocation permission denied.`);
          this.gpsPosition.set(NoGPSCoord());
          return NoGPSCoord();
        }
      }
    }

    console.timeEnd('geo.permissions');
    if (environment.gps) {
      console.error(`Fake GPS position was returned ${environment.gps}`);
      this.gpsPosition.set(environment.gps);
      return environment.gps; // Return a fake location
    }

    if (secondsBetween(this.lastGpsUpdate, new Date()) < 10) {
      return this.gpsPosition();
    }
    const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });

    let gps = { lat: position.coords.latitude, lng: position.coords.longitude };
    if (environment.latitudeOffset && environment.longitudeOffset) {
      const before = structuredClone(gps);
      const after = { lat: gps.lat + environment.latitudeOffset, lng: gps.lng + environment.longitudeOffset };
      gps = after;
      console.error(`GPS Position was modified ${JSON.stringify(before)} to ${JSON.stringify(after)}`);
    }
    this.lastGpsUpdate = new Date();
    this.gpsPosition.set(gps);
    this.hasPermission = true;
    return gps;
  }

  public async gpsToPoint(coord: GpsCoord, circleRadius: number): Promise<Point> {
    return await this.db.gpsToPoint(coord);
  }
}