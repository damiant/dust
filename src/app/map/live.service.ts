import { inject, Injectable } from '@angular/core';
import { ApiService } from '../data/api.service';
import { LiveLocation } from '../data/models';

// Gets live location data from the server. Eg:
// https://data.dust.events/loveburn/locations.json
// Applies it to the map
@Injectable({
  providedIn: 'root',
})
export class LiveService {
  private lastUpdate = 0;
  private api = inject(ApiService);
  private locations: LiveLocation[] = [];
  private callbackFn: (locations: LiveLocation[]) => void = () => {};

  public update(callback: (locations: LiveLocation[]) => void): void {
    this.callbackFn = callback;
    this.updateCallback();
    this.updateData();
  }

  private updateCallback() {
    this.callbackFn(this.locations);
  }

  private async updateData() {
    // Update only once a minute
    if (Math.abs(Date.now() - this.lastUpdate) < 60000) {
      return;
    }

    this.lastUpdate = Date.now();
    const newLocations = await this.api.getLiveLocations();
    // TODO: Be smarter here: Only update the changed locations and minimize callbacks.
    this.locations = newLocations;
    this.updateCallback();
  }
}
