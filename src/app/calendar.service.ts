import { inject, Injectable } from '@angular/core';
import { UiService } from './ui/ui.service';
import { ToastController } from '@ionic/angular/standalone';
import { Network } from '@capacitor/network';

export interface CalendarEvent {
  calendar: string;
  name: string;
  location: string | undefined;
  description: string;
  start: string;
  end: string;
  timeZone: string;
  lat?: number;
  lng?: number;
}
@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  events: CalendarEvent[] = [];
  ui = inject(UiService);
  toast = inject(ToastController);

  add(event: CalendarEvent): void {
    this.events.push(event);
  }

  async launch(): Promise<string> {
    // POST to api.dust.events/calendar
    // returns url and launch it
    try {
      const status = await Network.getStatus();
      if (!status.connected) {
        this.ui.presentToast(`The calendar export feature requires internet access but you do not have a connection.`, this.toast, undefined, 5000);
        return '';

      }
      this.ui.presentDarkToast('Exporting calendar...', this.toast);
      const res = await fetch(`https://api.dust.events/calendar`, { method: 'POST', body: JSON.stringify(this.events) });
      if (res.status !== 200) {
        this.ui.presentToast(`The calendar export feature requires internet access but an error ${res.status} occurred trying to access the feature.`, this.toast, undefined, 5000);
        return '';
      }
      const { url } = await res.json();
      console.log(`Received calendar`, url);
      this.events = [];
      return url;
    } catch (e) {
      console.error('Error launching calendar', e);
      this.ui.presentToast(`Error launching calendar: ${e}`, this.toast, undefined, 5000);
      return '';
    }
  }

  changeTimeZone(date: Date, timeZone: string) {
    // suppose the date is 12:00 UTC
    var d = new Date(
      date.toLocaleString('en-US', {
        timeZone,
      }),
    );

    var diff = -(date.getTime() - d.getTime());

    return new Date(date.getTime() - diff); // needs to subtract
  }
}
