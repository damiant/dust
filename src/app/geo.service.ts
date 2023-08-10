import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { GpsCoord, Point, gpsToMap, setReferencePoints } from './map/geo.utils';
import { DbService } from './db.service';
import { MapPoint } from './models';

@Injectable({
  providedIn: 'root'
})
export class GeoService {

  constructor(private db: DbService) { }

  // Returns true if you are granted permission
  public async checkPermissions(): Promise<boolean> {
    const status = await Geolocation.checkPermissions();
    return !(status.location == 'denied' || status.coarseLocation == 'denied');
  }

  public async getPermission(): Promise<boolean> {
    const status = await Geolocation.requestPermissions({ permissions: ['location'] });
    return (status.location == 'granted');
  }

  public async getPosition(): Promise<GpsCoord> {
    if (!await this.checkPermissions()) {
      if (!await this.getPermission()) {
        console.error(`User geolocation permission denied.`);
        return { lat: 0, lng: 0 };
      }
    }
    const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
    return { lat: position.coords.latitude, lng: position.coords.longitude };   
  }

  public async placeOnMap(coord: GpsCoord, mapPointToPoint: (mapPoint: MapPoint) => Point): Promise<Point> {
    const refs = await this.db.getGeoReferences();
    console.log('placeOnMap.refs', refs)
    const gpsCoords: GpsCoord[] = [];
    const points: Point[] = [];
    for (let ref of [refs[0], refs[1], refs[2]]) {
      gpsCoords.push({ lat: ref.coordinates[0], lng: ref.coordinates[1] });
      const mp: MapPoint = { clock: ref.clock, street: ref.street };
      const pt = mapPointToPoint(mp);
      points.push(pt);
    }
    setReferencePoints(gpsCoords, points);
    const point = gpsToMap(coord);
    console.log('placeOnMap.point', point);
    return point;



  }
}
