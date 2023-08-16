import { Injectable, signal } from '@angular/core';
import { Event, Favorites, Friend, MapPoint, OccurrenceSet } from '../data/models';
import { NotificationService } from '../notifications/notification.service';
import { Preferences } from '@capacitor/preferences';
import { SettingsService } from '../data/settings.service';
import { DbService } from '../data/db.service';
import { getDayName, getOccurrenceTimeString, now } from '../utils/utils';
import { Haptics, ImpactStyle } from '@capacitor/haptics';


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
  private mapPointsTitle: string = '';
  private mapPoints: MapPoint[] = [];

  private favorites: Favorites = { art: [], events: [], camps: [], friends: [] };

  constructor(private notificationService: NotificationService, private settingsService: SettingsService, private db: DbService) {
    this.init(this.settingsService.settings.dataset);
  }


  public async init(dataset: string) {
    this.dataset = dataset;
    this.ready = this.load();
  }

  public setMapPoints(mapPoints: MapPoint[]) {
    this.mapPoints = mapPoints;
  }

  public setMapPointsTitle(title: string) {
    this.mapPointsTitle = title;
  }

  public getMapPointsTitle() {
    return this.mapPointsTitle;
  }

  public getMapPoints(): MapPoint[] {
    return this.mapPoints;
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
    return this.starredEvent(id, occurrence);
  }

  private starredEvent(id: string, occurrence: OccurrenceSet) {
    return this.favorites.events.includes(`${id}-${occurrence.start_time}`);
  }

  public async setEventStars(event: Event) {
    await this.ready;
    for (let occurrence of event.occurrence_set) {
      occurrence.star = this.starredEvent(event.uid, occurrence);
    }
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
      await Haptics.impact({ style: ImpactStyle.Heavy });
      return (result.error) ? result.error : result.message;
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
    if (star) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    }
  }

  public async addFriend(friend: Friend) {
    this.favorites.friends.push(friend);
    await this.saveFavorites();
  }

  public async updateFriend(friend: Friend, old: Friend) {
    const idx = this.favorites.friends.findIndex((f) => f.name == old.name && f.address == old.address);
    this.favorites.friends[idx] = friend;
    await this.saveFavorites();
  }

  public async deleteFriend(toDelete: Friend) {
    this.favorites.friends = this.favorites.friends.filter((friend) => friend.name !== toDelete.name || friend.address !== toDelete.address);
    await this.saveFavorites();
  }

  public async starCamp(star: boolean, campId: string) {
    this.favorites.camps = this.include(star, campId, this.favorites.camps);
    await this.saveFavorites();
    if (star) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    }
  }

  public async getEventList(ids: string[], historical: boolean): Promise<Event[]> {
    const events = await this.db.getEventList(this.eventsFrom(ids));
    // Group events and Set event time string to favorited event occurrence
    const eventItems = await this.splitEvents(events, historical);
    this.groupEvents(eventItems);
    return eventItems;
  }

  private async splitEvents(events: Event[], historical: boolean): Promise<Event[]> {
    const eventItems: Event[] = [];
    const timeNow = now().getTime();
    for (let event of events) {
      for (let occurrence of event.occurrence_set) {
        occurrence.star = await this.isFavEventOccurrence(event.uid, occurrence);
        if (occurrence.star) {
          const eventItem = structuredClone(event);
          eventItem.occurrence_set = [structuredClone(occurrence)];

          let start: Date = new Date(occurrence.start_time);
          let end: Date = new Date(occurrence.end_time);

          const isOld = (end.getTime() - timeNow < 0);
          const isHappening = (start.getTime() < timeNow) && !isOld;
          eventItem.occurrence_set[0].old = isOld;
          eventItem.occurrence_set[0].happening = isHappening;
          // console.log(eventItem.title);
          // console.log(`Ends ${end} (${end.getTime()}), now=${now()} (${timeNow}), isHappening=${isHappening} isOld=${isOld}`);
          eventItem.old = isOld;
          eventItem.happening = isHappening;
          const times = getOccurrenceTimeString(start, end, undefined);
          eventItem.timeString = times ? times?.short : '';
          eventItem.longTimeString = times ? times?.long : '';
          if (!eventItem.old || historical) {
            eventItems.push(eventItem);
          }
        }
      }
    }
    eventItems.sort((a, b) => { return Date.parse(a.occurrence_set[0].start_time) - Date.parse(b.occurrence_set[0].start_time); });
    return eventItems;
  }

  private groupEvents(events: Event[]) {
    let group = '';
    for (let event of events) {
      const day = getDayName(event.occurrence_set[0].start_time);
      if (day !== group) {
        group = day;
        event.group = group;
      }
    }
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
