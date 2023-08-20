import { Injectable, signal } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { GpsCoord, NoGPSCoord, Point, timeStampGPS } from '../map/geo.utils';
import { DbService } from '../data/db.service';
import { environment } from 'src/environments/environment';
import { Capacitor } from '@capacitor/core';
import { noDate, secondsBetween } from '../utils/utils';
import {  toMapPoint } from '../map/map.utils';
import { CompassHeading } from '../map/compass';
import { MapPoint } from '../data/models';

@Injectable({
  providedIn: 'root'
})
export class GeoService {
  public gpsPosition = signal(NoGPSCoord());
  public heading = signal(this.noCompassHeading());
  private lastGpsUpdate: Date = noDate();
  private hasPermission = false;
  private centerOfMap: GpsCoord | undefined;


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
      headingAccuracy: 0
    }
  }

  public async getMapPointToGPS(mp: MapPoint): Promise<GpsCoord> {
    return await this.db.getMapPointGPS(mp);
  }

  public async getPosition(): Promise<GpsCoord> {
    if (!Capacitor.isNativePlatform()) {
      console.error(`On web we return the coord of center camp`);
      this.gpsPosition.set({ lng: -119.21121456711064, lat: 40.780501492435846, timeStamp: new Date().getTime() });
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
      this.gpsPosition.set(timeStampGPS(environment.gps));
      return environment.gps; // Return a fake location
    }

    if (secondsBetween(this.lastGpsUpdate, new Date()) < 10) {
      return this.gpsPosition();
    }
    const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });

    let gps = { lat: position.coords.latitude, lng: position.coords.longitude };
    gps = this.db.offsetGPS(gps);
    this.lastGpsUpdate = new Date();
    this.gpsPosition.set(timeStampGPS(gps));
    this.hasPermission = true;
    return gps;
  }

  public async gpsToPoint(coord: GpsCoord): Promise<Point> {
    return await this.db.gpsToPoint(coord);
  }
}