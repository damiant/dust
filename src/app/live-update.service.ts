import { Injectable } from '@angular/core';
import { Capacitor, HttpResponse } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { Preferences } from '@capacitor/preferences';
//import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { AlertController } from '@ionic/angular/standalone';
import { CapacitorHttp } from '@capacitor/core';

@Injectable({
  providedIn: 'root',
})
export class LiveUpdateService {
  public async checkVersion(alert: AlertController) {
    if (Capacitor.getPlatform() == 'web') return;

    const status = await Network.getStatus();
    if (status.connectionType !== 'wifi') {
      // Only attempt an update if on wifi
      return;
    }

    // Uncomment to test
    const CapacitorUpdater: any = undefined;

    // Download https://updates.dust.events/version.json
    const url = `https://updates.dust.events/version.json`;
    console.log(`Checking for updates at ${url}`);
    const res: HttpResponse = await CapacitorHttp.get({ url, headers: { 'cache': 'no-cache' } });
    console.log(`Received ${res.data}`);
    const json = JSON.parse(res.data);

    const currentVersion = await this.currentVersion();
    const builtInVersion = await CapacitorUpdater.getBuiltinVersion();
    console.log(`Built in version is ${builtInVersion.version}`);
    if (json.version !== currentVersion) {
      console.log(`Current version is ${currentVersion}. Latest version is ${json.version}`);
      console.log(`Downloading ${json.version}`);
      const data = await CapacitorUpdater.download({
        version: json.version,
        url: 'https://updates.dust.events/app-v1.zip',
      });
      console.log(`Applying Update ${json.version}`);
      await CapacitorUpdater.set(data);
      console.log(`Completed Update ${json.version}`);
      await this.setVersion(json.version);
    }
  }

  private async currentVersion(): Promise<string | null> {
    const { value } = await Preferences.get({ key: 'liveUpdateVersion' });
    return value;
  }

  private async setVersion(version: string) {
    await Preferences.set({ key: 'liveUpdateVersion', value: version });
  }


}
