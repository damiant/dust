import { Injectable, signal } from '@angular/core';
import { Event, Favorites, Friend, MapPoint, OccurrenceSet, RSLEvent, RSLOccurrence } from '../data/models';
import { NotificationService, ScheduleResult } from '../notifications/notification.service';
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

  private favorites: Favorites = { art: [], events: [], camps: [], friends: [], rslEvents: [] };

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
    return { art: [], events: [], camps: [], friends: [], rslEvents: [] };
  }

  public async getFavorites(): Promise<Favorites> {
    await this.ready;
    this.scrub();
    return this.favorites;
  }

  // This is required because during upgrading an app new fields need to be initialized
  private scrub() {
    if (!this.favorites.rslEvents) {
      this.favorites.rslEvents = [];
    }
    if (!this.favorites.friends) {
      this.favorites.friends = [];
    }
    if (!this.favorites.events) {
      this.favorites.events = [];
    }
    if (!this.favorites.art) {
      this.favorites.art = [];
    }
    if (!this.favorites.camps) {
      this.favorites.camps = [];
    }
  }

  public setFavorites(events: RSLEvent[], favs: string[]) {
    for (let event of events) {
      for (let occurrence of event.occurrences) {
        occurrence.star = (favs.includes(this.rslId(event, occurrence)));
      }
    }
    return events;   
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
    const id = this.eventId(event, occurrence);
    this.favorites.events = this.include(star, id, this.favorites.events);
    console.log('starEvent', star, JSON.stringify(this.favorites));
    await this.saveFavorites();

    if (star) {
      const title = event.location ? `${event.location}: ${event.title}` : event.title;
      const comment = `when ${event.title} starts`;
      const result = await this.notificationService.scheduleAll(
        {
          id: event.uid,
          title,
          body: event.description,
          comment
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

  public async starRSLEvent(star: boolean, event: RSLEvent, occurrence: RSLOccurrence): Promise<string | undefined> {
    const id = this.rslId(event, occurrence);
    this.favorites.rslEvents = this.include(star, id, this.favorites.rslEvents);
    await this.saveFavorites();
    const when: OccurrenceSet = { start_time: occurrence.startTime, end_time: occurrence.endTime, old: false, happening: true, longTimeString: '' };
    if (star) {
      const title = `${occurrence.who} @ ${event.camp} (${event.location}) is starting soon`;
      const comment = `when ${occurrence.who} starts`;
      const result: ScheduleResult = await this.notificationService.scheduleAll(
        {
          id,
          title,
          body: `${occurrence.who} starts ${occurrence.timeRange} at ${event.camp} - ${event.title ? event.title : ''}`,
          comment
        },
        [when]);
      await Haptics.impact({ style: ImpactStyle.Heavy });
      return (result.error) ? result.error : result.message;
    } else {
      this.notificationService.unscheduleAll(id);
      return undefined;
    }
  }

  public rslId(event: RSLEvent, occurrence: RSLOccurrence): string {
    return `${event.id}-${occurrence.id}`;
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

  public async getEventList(ids: string[], historical: boolean, rslEvents: RSLEvent[]): Promise<Event[]> {
    const events = await this.db.getEventList(this.eventsFrom(ids));
    // Group events and Set event time string to favorited event occurrence
    const eventItems = await this.splitEvents(events, historical);
    for (let rslEvent of rslEvents) {
      this.toEvent(rslEvent, eventItems);
    }
    this.sortByStartTime(eventItems);
    this.groupEvents(eventItems);
    return eventItems;
  }

  public async getRSLEventList(ids: string[]): Promise<RSLEvent[]> {
    const events = await this.db.getRSLEvents(ids);
    return events;
  }

  private toEvent(rslEvent: RSLEvent, items: Event[]) {
    for (let o of rslEvent.occurrences) {
      const party = rslEvent.title ? `the ${rslEvent.title} party `: '';
      const newEvent: Event = {
        camp: rslEvent.artCar ? `${rslEvent.artCar} mutant vehicle` : rslEvent.camp,
        timeString: o.timeRange,
        start: new Date(o.startTime),
        location: rslEvent.artCar ? 'playa' : rslEvent.location,
        longTimeString: o.timeRange,
        old: false,
        happening: false,
        all_day: undefined,
        event_id: 0,
        distance: 0,
        distanceInfo: '',
        event_type: { abbr: '', label: '', id: 0},
        gpsCoords: {lat: 0, lng: 0},
        description: '',
        slug: '',        
        print_description: `${o.who} is playing ${party}${rslEvent.artCar ? 'on the '+rslEvent.artCar+' mutant vehicle' : 'at '+rslEvent.camp}.`,
        occurrence_set: [{ start_time: o.startTime, end_time: o.endTime, star: true, old: false, happening: false, longTimeString: o.timeRange }],
        title: o.who,
        uid: '',// rslEvent.campUID!,
        url: undefined,
        year: 2000
      }
      items.push(newEvent);
    }
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
    return eventItems;
  }

  public sortByStartTime(eventItems: Event[]) {
    eventItems.sort((a, b) => { return Date.parse(a.occurrence_set[0].start_time) - Date.parse(b.occurrence_set[0].start_time); });
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
    if (!items) {
      items = [];
    }
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
