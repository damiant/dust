import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';

@Injectable({
  providedIn: 'root'
})
export class GeoService {

  constructor() { }

  // Returns true if you are granted permission
  public async checkPermissions(): Promise<boolean> {
    const status = await Geolocation.checkPermissions();
    return !(status.location == 'denied' || status.coarseLocation == 'denied');
  }

  public async getPermission(): Promise<boolean> {
    const status = await Geolocation.requestPermissions({ permissions: [ 'location' ]});
    return (status.location == 'granted');
  }

  public async getPosition() {
    if (!await this.checkPermissions()) {
      if (!await this.getPermission()) {
        console.error(`User geolocation permission denied.`);
        return;
      }
    }
    const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
    console.log(position);
  }
}
