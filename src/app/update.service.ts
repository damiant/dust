import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { AppUpdate, AppUpdateAvailability, AppUpdateResultCode } from '@capawesome/capacitor-app-update';
import { AlertController } from '@ionic/angular/standalone';
import { Network } from '@capacitor/network';

let updateCheckDone = false;

@Injectable({
  providedIn: 'root',
})
export class UpdateService {
  public async checkVersion(alert: AlertController) {
    if (Capacitor.getPlatform() == 'web') return;

    const status = await Network.getStatus();
    if (status.connectionType !== 'wifi') {
      // Only attempt an update if on wifi
      console.log(`Network connect is not wifi so not checking for udpates`);
      return;
    }
    if (updateCheckDone) {
      console.log('Update check already done, skipping');
      return;
    }
    updateCheckDone = true;
    const result = await AppUpdate.getAppUpdateInfo();
    if (result.updateAvailability !== AppUpdateAvailability.UPDATE_AVAILABLE) {
      console.log('No update available');
      return;
    }

    // Let use know about update
    const willUpdate = await this.presentConfirm(alert, 'An update to the dust app is required. Update now?');
    if (!willUpdate) {
      return;
    }

    if (Capacitor.getPlatform() == 'ios') {
      await AppUpdate.openAppStore({ appId: '6456943178' });
    } else {
      if (result.immediateUpdateAllowed) {
        const code = await AppUpdate.performImmediateUpdate();
        if (code && code.code === AppUpdateResultCode.OK) {
          console.log('Update performed successfully');
        } else {
          this.presentConfirm(
            alert,
            `Please visit the store and update manually. Update failed with code: ${code.code}`,
          );
        }
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
