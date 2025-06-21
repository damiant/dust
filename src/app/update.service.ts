import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { AppUpdate } from '@capawesome/capacitor-app-update';
import { AlertController } from '@ionic/angular/standalone';
import { Network } from '@capacitor/network';

@Injectable({
  providedIn: 'root',
})
export class UpdateService {

  public async checkVersion(alert: AlertController) {
    if (Capacitor.getPlatform() == 'web') return;

    const status = await Network.getStatus();
    if (status.connectionType !== 'wifi') {
      // Only attempt an update if on wifi
      console.log(`Network connect is not wifi so not checking for udpates`)
      return;
    }
    const result = await AppUpdate.getAppUpdateInfo();
    // Let use know about update
    const willUpdate = await this.presentConfirm(alert, 'An update to the dust app is required. Update now?');
    if (!willUpdate) {
      return;
    }

    if (Capacitor.getPlatform() == 'ios') {
      await AppUpdate.openAppStore({ appId: '6456943178'});
    } else {
      if (result.immediateUpdateAllowed) {
        await AppUpdate.performImmediateUpdate();
      }
    }
  }

  private async presentConfirm(alert: AlertController, message: string): Promise<boolean> {
    return new Promise(async (resolve) => {
      const a = await alert.create({
        header: 'Confirm',
        message,
        buttons: [
          {
            text: 'Update',
            role: 'cancel',
            handler: () => {
              resolve(true);
            },
          },
          {
            text: 'Skip',
            handler: () => {
              resolve(false);
            },
          },
        ],
      });

      await a.present();
    });
  }
}
