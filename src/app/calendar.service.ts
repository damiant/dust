import { Injectable } from '@angular/core';
import { Calendar } from '@awesome-cordova-plugins/calendar';
import { Capacitor } from '@capacitor/core';

export interface CalendarEvent {
  calendar: string,
  name: string,
  location: string | undefined,
  description: string,
  start: string,
  end: string,
  timeZone: string,
  lat?: number
  lng?: number
}
@Injectable({
  providedIn: 'root'
})
export class CalendarService {

  constructor() { }

  async add(event: CalendarEvent): Promise<boolean> {
    try {
      const hasPermission = await Calendar.hasReadWritePermission();
      console.log('hasPermission', hasPermission);      
      await this.init(event.calendar);
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);
      let events = [];
      try {
        if (Capacitor.getPlatform() == 'android') {          
          const found = await Calendar.findEvent(event.name, undefined, undefined, startDate, endDate);
          console.log('Found is', found);
          events = [];
          if (found && found.length > 0) {
            console.log(`Delete Event by id ${found[0].id}`);
            await Calendar.deleteEventById(found[0].id);
          }
          console.log(`event`);
        } else {
          events = await Calendar.findAllEventsInNamedCalendar(event.calendar);
        }
      } catch (e) {
        console.log(`findAllEventsInNamedCalendar Failed`, e);
        events = [];
      }
      const found = events.find((e: any) => e.title == event.name);
      if (found) {
        console.log(`Delete calendar event ${found.title} ${found.id}`);
        try {
          await Calendar.deleteEventById(found.id);
        } catch (e) {
          // Ignore the error: delete should work
        }
      }
      console.log(`adding event ${event.name} ${startDate}-${endDate}...`);


      const calendarId = await Calendar.createEventWithOptions(
        event.name, this.getLocation(event), event.description, startDate, endDate, { calendarName: event.calendar });
      console.log(`Id of event ${event.name} added to calendar ${event.calendar}`, calendarId);

      return hasPermission;
    } catch (e) {
      console.error(e);
      return false;
    }
  }  

  async deleteOld(calendarName: string, titles: string[]): Promise<boolean> {
    try {
      if (Capacitor.getPlatform() == 'android') {
        // Not supported
        return true;
      }
      const hasPermission = await Calendar.hasReadWritePermission();
      console.log('hasPermission', hasPermission);
      const events = await Calendar.findAllEventsInNamedCalendar(calendarName);
      for (const event of events) {
        const found = titles.find((e: string) => e == event.name);
        if (!found && event.name !== calendarName) {
          // Delete this
          await Calendar.deleteEventById(event.id);
        }
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  private getLocation(event: CalendarEvent): string {
    if (event.location) {
      return event.location;
    }
    if (!event.lat) {
      return event.location ?? '';
    }

    if (Capacitor.getPlatform() == 'ios') {
      return `maps://www.google.com/maps/dir/?api=1&travelmode=driving&layer=traffic&destination=${event.lat},${event.lng}`;
    } else {
      return `https://www.google.com/maps/dir/?api=1&travelmode=driving&layer=traffic&destination=${event.lat},${event.lng}`;
    }
  }

  private async init(name: string) {
    try {
      const calendars = await Calendar.listCalendars();
      const calendar = calendars.find((c: any) => c.name == name);
      if (calendar.name == name) return; // Already added
    } catch (e) {
      console.error('Unable to listCalendars', e);
    }
    const r = await Calendar.createCalendar({ calendarName: name, calendarColor: '#F61067' });
    console.log(r);
  }

  changeTimeZone(date: Date, timeZone: string) {

    // suppose the date is 12:00 UTC
    var d = new Date(date.toLocaleString('en-US', {
      timeZone
    }));

    var diff = - (date.getTime() - d.getTime());

    return new Date(date.getTime() - diff); // needs to subtract

  }
}
