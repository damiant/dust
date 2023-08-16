import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { GpsCoord, Point, gpsToMap, setReferencePoints } from '../map/geo.utils';
import { DbService } from '../data/db.service';
import { MapPoint } from '../data/models';
import { getPoint, toClock, toStreetRadius } from '../map/map.utils';
import { environment } from 'src/environments/environment';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class GeoService {

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
      console.error(`On web we return the coord of center camp`)
      return { lat: -119.21121456711064, lng: 40.780501492435846 };
    }

    if (!await this.checkPermissions()) {
      if (!await this.getPermission()) {
        console.error(`User geolocation permission denied.`);
        return { lat: 0, lng: 0 };
      }
    }
    if (environment.gps) {
      return environment.gps; // Return a fake location
    }

    const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
    return { lat: position.coords.latitude, lng: position.coords.longitude };
  }

  public async placeOnMap(coord: GpsCoord, circleRadius: number): Promise<Point> {
    const point = await this.db.gpsToPoint(coord);

    return point;
  }
}