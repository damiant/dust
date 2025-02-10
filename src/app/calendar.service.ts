import { Injectable } from '@angular/core';

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

  add(event: CalendarEvent): void {
    this.events.push(event);
  }

  async launch(): Promise<void> {
    // POST to api.dust.events/calendar
    // returns url and launch it
    const res = await fetch(`https://api.dust.events/calendar`, { method: 'POST', body: JSON.stringify(this.events) });
    const { url } = await res.json();
    this.events = [];
    window.open(url, "_blank");
    
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
