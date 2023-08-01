import { Injectable, signal } from '@angular/core';
import { Event, Favorites, OccurrenceSet } from './models';
import { NotificationService } from './notification.service';
import { Preferences } from '@capacitor/preferences';
import { SettingsService } from './settings.service';

enum DbId {
  favorites = 'favorites'
}

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {

  private ready: Promise<void> | undefined;
  public changed = signal(1);
  private dataset: string = '';

  private favorites: Favorites = { art: [], events: [], camps: [], friends: [] };

  constructor(private notificationService: NotificationService, private settingsService: SettingsService) {
    this.init(this.settingsService.settings.dataset);
  }


  public async init(dataset: string) {
    this.dataset = dataset;
    this.ready = this.load();
  }

  private noData(): Favorites {
    return { art: [], events: [], camps: [], friends: [] };
  }

  public async getFavorites(): Promise<Favorites> {
    await this.ready;
    return this.favorites;
  }

  public async isFavEventOccurrence(id: string, occurrence: OccurrenceSet): Promise<boolean> {
    await this.ready;
    return this.favorites.events.includes(`${id}-${occurrence.start_time}`);
  }

  public async isFavArt(id: string): Promise<boolean> {
    await this.ready;
    return this.favorites.art.includes(id);
  }

  public async isFavCamp(id: string): Promise<boolean> {
    await this.ready;
    return this.favorites.camps.includes(id);
  }

  public eventsFrom(eventOccurrences: string[]): string[] {
    const result = [];
    for (const eventOccurrence of eventOccurrences) {
      const oc = eventOccurrence.split('-');
      result.push(oc[0]);
    }
    return result;
  }

  public async starEvent(star: boolean, event: Event, selectedDay: Date, occurrence?: OccurrenceSet): Promise<string | undefined> {
    this.favorites.events = this.include(star, this.eventId(event, occurrence), this.favorites.events);
    console.log('starEvent', star, JSON.stringify(this.favorites));
    await this.saveFavorites();

    if (star) {
      const title = event.location ? `${event.location}: ${event.title}` : event.title;
      const result = await this.notificationService.scheduleAll(
        {
          id: event.uid,
          title,
          body: event.description
        },
        occurrence ? [occurrence] : event.occurrence_set,
        selectedDay);
      return (result.error) ? result.error : `${result.notifications} notification${result.notifications != 1 ? 's' : ''} scheduled for this event`;
    } else {
      // Remove notifications
      this.notificationService.unscheduleAll(event.uid);
      return undefined;
    }
  }

  private eventId(event: Event, occurrence?: OccurrenceSet): string {
    if (!occurrence) {
      return event.uid;
    } else {
      return `${event.uid}-${occurrence.start_time}`;
    }
  }

  public async starArt(star: boolean, artId: string) {
    this.favorites.art = this.include(star, artId, this.favorites.art);
    await this.saveFavorites();

  }

  public async starCamp(star: boolean, campId: string) {
    this.favorites.camps = this.include(star, campId, this.favorites.camps);
    await this.saveFavorites();
  }

  private async saveFavorites() {
    const id = DbId.favorites;
    const value = this.favorites;
    await Preferences.set({ key: `${this.dataset}-${id}`, value: JSON.stringify(value) });
    console.log('saved', value);
    const i = this.changed();
    this.changed.set(i + 1);
  }

  private async get(id: DbId, defaultValue: any): Promise<any> {
    try {
      const result = await Preferences.get({ key: `${this.dataset}-${id}` });
      if (result.value == null) {
        return defaultValue;
      }
      return result.value;
    } catch {
      return defaultValue;
    }
  }



  private async load() {
    try {
      this.favorites = JSON.parse(await this.get(DbId.favorites, this.favorites));
      console.log('loaded', this.favorites);
    } catch {
      this.favorites = this.noData();
    }

  }

  private include(add: boolean, value: string, items: string[]): string[] {
    if (add && !items.includes(value)) {
      items.push(value);
    }
    if (!add && items.includes(value)) {
      const i = items.indexOf(value);
      items.splice(i, 1);
    }
    return items;
  }
}
