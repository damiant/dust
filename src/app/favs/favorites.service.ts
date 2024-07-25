import { Injectable, signal, inject, WritableSignal } from '@angular/core';
import {
  Event,
  Favorites,
  Friend,
  MapPoint,
  OccurrenceSet,
  PrivateEvent,
  RSLEvent,
  RSLOccurrence,
  Thing,
} from '../data/models';
import { NotificationService, ScheduleResult } from '../notifications/notification.service';
import { Preferences } from '@capacitor/preferences';
import { SettingsService } from '../data/settings.service';
import { DbService } from '../data/db.service';
import { clone, getDayName, getOccurrenceTimeString, now, sameDay } from '../utils/utils';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { GpsCoord } from '../map/geo.utils';

enum DbId {
  favorites = 'favorites',
  things = 'things'
}

@Injectable({
  providedIn: 'root',
})
export class FavoritesService {
  private notificationService = inject(NotificationService);
  private settingsService = inject(SettingsService);
  private db = inject(DbService);
  private ready: Promise<void> | undefined;
  public changed = signal(1);
  private dataset: string = '';
  private mapPointsTitle: string = '';
  private mapPoints: MapPoint[] = [];
  public things: WritableSignal<Thing[]> = signal([]);

  private favorites: Favorites = { art: [], events: [], camps: [], friends: [], rslEvents: [], privateEvents: [] };

  constructor() {
    this.init(this.settingsService.settings.datasetId);
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
    return { art: [], events: [], camps: [], friends: [], rslEvents: [], privateEvents: [] };
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
    if (!this.favorites.privateEvents) {
      this.favorites.privateEvents = [];
    }
  }

  public setFavorites(events: RSLEvent[], favs: string[]) {
    for (let event of events) {
      for (let occurrence of event.occurrences) {
        occurrence.star = favs.includes(this.rslId(event, occurrence));
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
      // events may start with u-[number]
      if (oc[0] == 'u') {
        result.push(oc[0] + '-' + oc[1]);
      } else {
        result.push(oc[0]);
      }
    }
    return result;
  }

  public selectOccurrence(event: Event, selectedDay: Date): OccurrenceSet | undefined {
    if (event.occurrence_set.length == 1) {
      return event.occurrence_set[0];
    }
    for (const occurrence of event.occurrence_set) {
      if (sameDay(new Date(occurrence.start_time), selectedDay)) {
        return occurrence;
      }
    }
    return undefined;
  }

  public async starEvent(
    star: boolean,
    event: Event,
    selectedDay: Date,
    occurrence?: OccurrenceSet,
  ): Promise<string | undefined> {
    const id = this.eventId(event, occurrence);
    this.favorites.events = this.include(star, id, this.favorites.events);

    await this.saveFavorites();

    if (star) {
      const title = event.location ? `${event.location}: ${event.title}` : event.title;
      const comment = `when ${event.title} starts`;
      const result = await this.notificationService.scheduleAll(
        {
          id: event.uid,
          title,
          body: event.description,
          comment,
        },
        occurrence ? [occurrence] : event.occurrence_set,
        selectedDay,
      );
      await Haptics.impact({ style: ImpactStyle.Heavy });
      return result.error ? result.error : result.message;
    } else {
      // Remove notifications
      this.notificationService.unscheduleAll(event.uid);
      return undefined;
    }
  }

  public async unstarRSLId(id: string) {
    this.favorites.rslEvents = this.include(false, id, this.favorites.rslEvents);
    await this.saveFavorites();
    await this.notificationService.unscheduleAll(id);
  }

  public async starRSLEvent(star: boolean, event: RSLEvent, occurrence: RSLOccurrence): Promise<string | undefined> {
    const id = this.rslId(event, occurrence);
    this.favorites.rslEvents = this.include(star, id, this.favorites.rslEvents);
    await this.saveFavorites();
    const when: OccurrenceSet = {
      start_time: occurrence.startTime,
      end_time: occurrence.endTime,
      old: false,
      happening: true,
      longTimeString: '',
    };
    if (star) {
      const title = `${occurrence.who} @ ${event.camp} (${event.location}) is starting soon`;
      const comment = `when ${occurrence.who} starts`;
      const result: ScheduleResult = await this.notificationService.scheduleAll(
        {
          id,
          title,
          body: `${occurrence.who} starts ${occurrence.timeRange} at ${event.camp} - ${event.title ? event.title : ''}`,
          comment,
        },
        [when],
      );
      await Haptics.impact({ style: ImpactStyle.Heavy });
      return result.error ? result.error : result.message;
    } else {
      this.notificationService.unscheduleAll(id);
      return undefined;
    }
  }

  public rslId(event: RSLEvent, occurrence: RSLOccurrence): string {
    return `${event.uid}-${occurrence.id}`;
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

  public async addPrivateEvent(event: PrivateEvent): Promise<string | undefined> {
    this.favorites.privateEvents.push(event);
    const result = await this.notifyPrivateEvent(event);
    this.sortPrivateEvents();
    await this.saveFavorites();
    return result;
  }

  private async notifyPrivateEvent(event: PrivateEvent): Promise<string | undefined> {
    const occurrenceSet: OccurrenceSet = {
      start_time: event.start,
      end_time: event.start,
      old: false,
      happening: false,
      longTimeString: '',
    };
    const result = await this.notificationService.scheduleAll(
      {
        id: event.id,
        title: event.title + ' @ ' + event.address,
        body: event.title + ' will start soon. ',
        comment: event.notes,
      },
      [occurrenceSet],
      undefined,
    );

    await Haptics.impact({ style: ImpactStyle.Heavy });
    return result.error ? result.error : result.message;
  }

  public async updateFriend(friend: Friend, old: Friend) {
    const idx = this.favorites.friends.findIndex((f) => f.name == old.name && f.address == old.address);
    this.favorites.friends[idx] = friend;
    await this.saveFavorites();
  }

  public async updatePrivateEvent(event: PrivateEvent, old: PrivateEvent) {
    const idx = this.favorites.privateEvents.findIndex((f) => f.title == old.title && f.address == old.address);
    this.favorites.privateEvents[idx] = event;
    this.sortPrivateEvents();
    await this.notificationService.unscheduleAll(event.id);
    await this.notifyPrivateEvent(event);
    await this.saveFavorites();
  }

  private sortPrivateEvents() {
    this.favorites.privateEvents.sort((a, b) => Number(new Date(a.start)) - Number(new Date(b.start)));
  }

  public async deleteFriend(toDelete: Friend) {
    this.favorites.friends = this.favorites.friends.filter(
      (friend) => friend.name !== toDelete.name || friend.address !== toDelete.address,
    );
    await this.saveFavorites();
  }

  public async deletePrivateEvent(toDelete: PrivateEvent) {
    this.favorites.privateEvents = this.favorites.privateEvents.filter(
      (event) => event.title !== toDelete.title || event.address !== toDelete.address,
    );
    await this.saveFavorites();
    await this.notificationService.unscheduleAll(toDelete.id);
  }

  public async starCamp(star: boolean, campId: string) {
    this.favorites.camps = this.include(star, campId, this.favorites.camps);
    await this.saveFavorites();
    if (star) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    }
  }

  public async getFavoriteEventsToday(): Promise<Event[]> {
    const favs = await this.getFavorites();
    return this.getEventList(favs.events, false, [], true);
  }

  public async getThings(): Promise<void> {
    const things: Thing[] = [];
    const result = await Preferences.get({ key: `${this.dataset}-${DbId.things}` });
    if (result.value) {
      things.push(...JSON.parse(result.value));
    }
    if (things.length == 0) {
      things.push({ name: 'My Camp', notes: '' });
      things.push({ name: 'My Bike', notes: '' });
    }
    this.things.update(() => [...things]);
  }

  public async addThing(thing: Thing) {
    const things = this.things();
    things.push(thing);
    this.things.update(() => [...things]);
    await this.saveThings(this.things());
  }

  public async deleteThing(thing: Thing) {
    const things = this.things();
    for (let t of things) {
      if (t.name == thing.name) {
        things.splice(things.indexOf(t), 1);
      }
    }
    this.things.update(() => [...things]);
    await this.saveThings(this.things());
  }

  public async clearThing(name: string) {
    let things = this.things();
    if (['My Camp', 'My Bike'].includes(name)) {
      for (let thing of things) {
        if (thing.name == name) {
          thing.gps = undefined;
        }
      }
    } else {
      things = things.filter(t => t.name != name);
    }
    this.things.update(() => [...things]);
    await this.saveThings(this.things());
  }

  public async setThingPosition(name: string, gps: GpsCoord) {
    await this.getThings();

    let things = this.things();
    for (let thing of things) {
      if (thing.name == name) {
        thing.gps = gps;
        thing.lastChanged = new Date().getTime();
      }
    }
    await this.saveThings(things);
    this.things.set(things);
  }

  private async saveThings(things: Thing[]) {
    await Preferences.set({ key: `${this.dataset}-${DbId.things}`, value: JSON.stringify(things) });
  }

  public async getEventList(ids: string[], historical: boolean, rslEvents: RSLEvent[], today: boolean): Promise<Event[]> {
    let events = await this.db.getEventList(this.eventsFrom(ids));

    // Group events and Set event time string to favorited event occurrence
    let eventItems = await this.splitEvents(events, historical, today);
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
      const party = rslEvent.title ? `the ${rslEvent.title} party ` : '';
      const newEvent: Event = {
        camp: rslEvent.artCar ? `${rslEvent.artCar} mutant vehicle` : rslEvent.camp,
        timeString: o.timeRange,
        start: new Date(o.startTime),
        end: new Date(o.endTime),
        location: rslEvent.artCar ? 'playa' : rslEvent.location,
        longTimeString: o.timeRange,
        old: false,
        happening: false,
        all_day: undefined,
        event_id: 0,
        distance: 0,
        pin: rslEvent.pin,
        distanceInfo: '',
        event_type: { abbr: '', label: '', id: 0 },
        gpsCoords: { lat: 0, lng: 0 },
        description: '',
        slug: this.rslId(rslEvent, o),
        print_description: `${o.who} is playing ${party}${rslEvent.artCar ? 'on the ' + rslEvent.artCar + ' mutant vehicle' : 'at ' + rslEvent.camp
          }.`,
        occurrence_set: [
          {
            start_time: o.startTime,
            end_time: o.endTime,
            star: true,
            old: false,
            happening: false,
            longTimeString: o.timeRange,
          },
        ],
        title: o.who,
        uid: '', // rslEvent.campUID!,
        url: undefined,
        year: 2000,
      };
      items.push(newEvent);
    }
  }

  private async splitEvents(events: Event[], historical: boolean, today: boolean): Promise<Event[]> {
    const eventItems: Event[] = [];
    const timeNow = now().getTime();
    for (let event of events) {
      for (let occurrence of event.occurrence_set) {
        occurrence.star = await this.isFavEventOccurrence(event.uid, occurrence);
        if (occurrence.star) {
          const eventItem = clone(event);
          eventItem.occurrence_set = [clone(occurrence)];

          let start: Date = new Date(occurrence.start_time);
          let end: Date = new Date(occurrence.end_time);

          const isOld = end.getTime() - timeNow < 0;
          const isHappening = start.getTime() < timeNow && !isOld;
          eventItem.occurrence_set[0].old = isOld;
          eventItem.occurrence_set[0].happening = isHappening;
          // console.log(eventItem.title);
          // console.log(`Ends ${end} (${end.getTime()}), now=${now()} (${timeNow}), isHappening=${isHappening} isOld=${isOld}`);
          eventItem.old = isOld;
          eventItem.happening = isHappening;
          const times = getOccurrenceTimeString(start, end, undefined, this.db.getTimeZone());
          eventItem.timeString = times ? times?.short : '';
          eventItem.longTimeString = times ? times?.long : '';
          const isToday = sameDay(start, now() || sameDay(end, now()));
          let filteredOut = today && !isToday;
          if (eventItem.old && !historical) filteredOut = true;
          if (!filteredOut) {
            eventItems.push(eventItem);
          }
        }
      }
    }
    return eventItems;
  }

  public sortByStartTime(eventItems: Event[]) {
    eventItems.sort((a, b) => {
      return Date.parse(a.occurrence_set[0].start_time) - Date.parse(b.occurrence_set[0].start_time);
    });
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
      await this.getThings();
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
