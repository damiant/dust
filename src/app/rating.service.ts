import { inject, Injectable } from '@angular/core';
import { SettingsService } from './data/settings.service';
import { InAppReview } from '@capacitor-community/in-app-review';

@Injectable({
  providedIn: 'root',
})
export class RatingService {
  settings = inject(SettingsService);
  constructor() {}

  public async rateAfterUsage() {
    const key = 'favCount';
    let usage = await this.settings.getInteger(key);
    usage++;
    await this.settings.setInteger(key, usage);
    if (usage == 4) {
      await InAppReview.requestReview();
    }
  }

  public async rate() {
    await InAppReview.requestReview();
  }
}
