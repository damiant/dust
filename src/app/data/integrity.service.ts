import { Injectable } from '@angular/core';
import { Capacitor, CapacitorHttp, HttpResponse } from '@capacitor/core';
//import { PlayIntegrity } from '@capacitor-community/play-integrity';

@Injectable({
  providedIn: 'root',
})
export class IntegrityService {
  // Sample of using the Play Integrity API to see if this mobile client is legitimate
  public async testIntegrity(): Promise<boolean> {
    try {
      if (Capacitor.getPlatform() !== 'android') {
        return true;
      }
      const PlayIntegrity: any = undefined;
      const result = await PlayIntegrity.requestIntegrityToken({
        nonce: this.generateUUID(),
        googleCloudProjectNumber: 150349171567,
      });

      const response: HttpResponse = await CapacitorHttp.post({
        url: `https://integrity.dust.events`,
        headers: { 'Content-Type': 'application/json' },
        data: { token: result.token },
      });
      if (response.status !== 200) {
        console.error('Application Integrity Failed');
        return false;
      }
      return true;
    } catch (err) {
      console.error(`Play Integrity Error`, err);
      return false;
    }
  }

  private generateUUID() {
    let d = new Date().getTime(); //Timestamp
    let d2 = (typeof performance !== 'undefined' && performance.now && performance.now() * 1000) || 0; //Time in microseconds since page-load or 0 if unsupported
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      let r = Math.random() * 16; //random number between 0 and 16
      if (d > 0) {
        //Use timestamp until depleted
        r = ((d + r) % 16) | 0;
        d = Math.floor(d / 16);
      } else {
        //Use microseconds since page-load if supported
        r = ((d2 + r) % 16) | 0;
        d2 = Math.floor(d2 / 16);
      }
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
}
