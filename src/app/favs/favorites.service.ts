import { Injectable, signal, inject, WritableSignal } from '@angular/core';
import {
  Event,
  Favorites,
  Friend,
  MapPoint,
  OccurrenceSet,
  Reminder,
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
import { RatingService } from '../rating.service';
import { MapPolygon } from '../map/map-model';

enum DbId {
  favorites = 'favorites',
  things = 'things',
}

const FAVORITES_API_KEY = '3f8b0ace-f43d-4955-94e2-8e8a02bfa897';
const FAVORITES_API_URL = 'https://api.dust.events/api/favorites';

@Injectable({
  providedIn: 'root',
})
export class FavoritesService {
  private notificationService = inject(NotificationService);
  private settingsService = inject(SettingsService);
  private ratingService = inject(RatingService);
  private db = inject(DbService);
  private ready: Promise<void> | undefined;
  public changed = signal(1);
  public newFavs = signal(0);
  private dataset: string = '';
  private mapPointsTitle: string = '';
  private mapPoints: MapPoint[] = [];
  private mapPolygons: MapPolygon[] = [];
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

  public setMapPolygons(mapPolygons: MapPolygon[]) {
    this.mapPolygons = mapPolygons;
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

  public getMapPolygons(): MapPolygon[] {
    return this.mapPolygons;
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

  public async clearFavs() {
    this.favorites.events = [];
    this.favorites.art = [];
    this.favorites.camps = [];
    this.favorites.rslEvents = [];
    await this.saveFavorites();
  }

  public setFavorites(events: RSLEvent[], favs: string[]) {
    for (const event of events) {
      for (const occurrence of event.occurrences) {
        occurrence.star = favs.includes(this.rslId(event, occurrence));
      }
    }
    return events;
  }

  public async setFavoritedList(events: Event[]): Promise<boolean> {
    let longEvents = false;
    for (const e of events) {
      await this.setEventStars(e);
      const occurrence = this.selectOccurrence(e, this.db.selectedDay());
      e.showStar = !!occurrence;
      e.showRecurring = !e.star && e.occurrence_set.length > 1;
      const starred = occurrence ? await this.isFavEventOccurrence(e.uid, occurrence) : false;
      e.star = starred;
      if (occurrence) {
        const length = this.hoursBetween(new Date(occurrence.end_time), new Date(occurrence.start_time));
        if (length > 5) {
          longEvents = true;
        }
      }
    }
    return longEvents;
  }

  private hoursBetween(d1: any, d2: any): number {
    return Math.ceil(Math.abs(d1 - d2) / 36e5);
  }

  public async isFavEventOccurrence(id: string, occurrence: OccurrenceSet): Promise<boolean> {
    await this.ready;
    return this.starredEvent(id, occurrence);
  }

  private starredEvent(id: string, occurrence: OccurrenceSet) {
    return this.favorites.events.includes(`${id}-${occurrence.start_time}`) || this.favorites.events.includes(`${id}`);
  }

  public async setEventStars(event: Event) {
    await this.ready;
    for (const occurrence of event.occurrence_set) {
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
    disableHaptics?: boolean,
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
      this.newFavs.set(this.newFavs() + 1);
      if (!disableHaptics) {
        await Haptics.impact({ style: ImpactStyle.Heavy });
        this.ratingService.rateAfterUsage();
      }
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
      this.newFavs.set(this.newFavs() + 1);
      await Haptics.impact({ style: ImpactStyle.Heavy });
    }
  }

  public async addFriend(friend: Friend) {
    this.favorites.friends.push(friend);
    await this.saveFavorites();
  }

  public async addReminder(event: Reminder): Promise<string | undefined> {
    this.favorites.privateEvents.push(event);
    const result = await this.notifyReminder(event);
    this.sortReminders();
    await this.saveFavorites();
    return result;
  }

  private async notifyReminder(event: Reminder): Promise<string | undefined> {
    const occurrenceSet: OccurrenceSet = {
      start_time: event.start,
      end_time: event.start,
      old: false,
      happening: false,
      longTimeString: '',
    };
    const title = event.address ? event.title + ' @ ' + event.address : event.title;
    const result = await this.notificationService.scheduleAll(
      {
        id: event.id,
        title,
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

  public async updatePrivateEvent(event: Reminder, old: Reminder) {
    const idx = this.favorites.privateEvents.findIndex((f) => f.title == old.title && f.address == old.address);
    this.favorites.privateEvents[idx] = event;
    this.sortReminders();
    await this.notificationService.unscheduleAll(event.id);
    await this.notifyReminder(event);
    await this.saveFavorites();
  }

  private sortReminders() {
    this.favorites.privateEvents.sort((a, b) => Number(new Date(a.start)) - Number(new Date(b.start)));
  }

  public async deleteFriend(toDelete: Friend) {
    this.favorites.friends = this.favorites.friends.filter(
      (friend) => friend.name !== toDelete.name || friend.address !== toDelete.address,
    );
    await this.saveFavorites();
  }

  public async deletePrivateEvent(toDelete: Reminder) {
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
      this.newFavs.set(this.newFavs() + 1);
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
      things.push({ name: 'My Bike', notes: '' });
      things.push({ name: 'My Camp', notes: '' });
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
    for (const t of things) {
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
      for (const thing of things) {
        if (thing.name == name) {
          thing.gps = undefined;
        }
      }
    } else {
      things = things.filter((t) => t.name != name);
    }
    this.things.update(() => [...things]);
    await this.saveThings(this.things());
  }

  public async setThingPosition(name: string, gps: GpsCoord) {
    await this.getThings();

    const things = this.things();
    for (const thing of things) {
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

  public async getEventList(
    ids: string[],
    historical: boolean,
    rslEvents: RSLEvent[],
    today: boolean,
  ): Promise<Event[]> {
    const events = await this.db.getEventList(this.eventsFrom(ids));

    // Group events and Set event time string to favorited event occurrence
    const eventItems = await this.splitEvents(events, historical, today);
    for (const rslEvent of rslEvents) {
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
    for (const o of rslEvent.occurrences) {
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
        hosted_by_camp: rslEvent.artCar ? undefined : rslEvent.campId,
        slug: this.rslId(rslEvent, o),
        description: `${o.who} is playing ${party}${
          rslEvent.artCar ? 'on the ' + rslEvent.artCar + ' mutant vehicle' : 'at ' + rslEvent.camp
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
        uid: rslEvent.uid,
        url: undefined,
        year: 2000,
      };
      items.push(newEvent);
    }
  }

  private async splitEvents(events: Event[], historical: boolean, today: boolean): Promise<Event[]> {
    const eventItems: Event[] = [];
    const timeNow = now().getTime();
    for (const event of events) {
      if (!Array.isArray(event.occurrence_set) || event.occurrence_set.length === 0) {
        // Stale/corrupt dataset entry may lack occurrences; skip it rather than crash
        console.warn('Skipping favorited event without occurrences', event.uid, event.title);
        continue;
      }
      for (const occurrence of event.occurrence_set) {
        occurrence.star = await this.isFavEventOccurrence(event.uid, occurrence);
        if (occurrence.star) {
          const eventItem = clone(event);
          eventItem.occurrence_set = [clone(occurrence)];

          const start: Date = new Date(occurrence.start_time);
          const end: Date = new Date(occurrence.end_time);

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
    for (const event of events) {
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

  /**
   * Split a list of stored event favorites into already-specific occurrence IDs
   * (e.g. "55518-2026-09-01T18:00:00" or "u-1234-2026-09-01T18:00:00") and bare
   * event UIDs that still need to be expanded (e.g. "55518" or "u-1234").
   */
  private classifyFavoriteEventIds(ids: string[]): { occurrenceIds: string[]; bareUids: string[] } {
    const occurrenceIds: string[] = [];
    const bareUids: string[] = [];
    for (const entry of ids) {
      if (entry.includes('-') && entry.split('-')[0] === 'u') {
        const parts = entry.split('-');
        if (parts.length > 2) {
          occurrenceIds.push(entry);
        } else {
          bareUids.push(entry);
        }
      } else if (!entry.includes('-')) {
        bareUids.push(entry);
      } else {
        occurrenceIds.push(entry);
      }
    }
    return { occurrenceIds, bareUids };
  }

  /**
   * Resolve any bare event UIDs into occurrence-specific IDs by looking up the
   * event in the local DB and emitting one entry per occurrence.
   */
  private async expandBareEventUids(
    occurrenceIds: string[],
    bareUids: string[],
  ): Promise<string[]> {
    if (bareUids.length === 0) return occurrenceIds;
    const events = await this.db.getEventList(bareUids);
    const result = occurrenceIds.slice();
    for (const event of events) {
      for (const occurrence of event.occurrence_set) {
        const occurrenceId = `${event.uid}-${occurrence.start_time}`;
        if (!result.includes(occurrenceId)) {
          result.push(occurrenceId);
        }
      }
    }
    return result;
  }

  /**
   * Serialize all favorites and POST to the favorites API
   * Returns the unique ID for sharing
   */
  async shareFavorites(): Promise<string> {
    await this.ready;
    this.scrub();

    // Expand any bare event UIDs into specific occurrence IDs so the recipient
    // only receives the occurrences that were actually favorited (not every
    // occurrence of the event).
    const { occurrenceIds, bareUids } = this.classifyFavoriteEventIds(this.favorites.events);
    const expandedEvents = await this.expandBareEventUids(occurrenceIds, bareUids);

    const payload = {
      events: expandedEvents,
      camps: this.favorites.camps,
      art: this.favorites.art,
      rslEvents: this.favorites.rslEvents,
    };

    const response = await fetch(FAVORITES_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-API-Key': FAVORITES_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to share favorites: ${response.status} - ${error}`);
    }

    const result = await response.json();
    return result.uniqueid;
  }

  /**
   * Get favorites from the API by unique ID and merge them
   * Avoids duplicating any existing favorites and schedules
   * notifications for the newly added event-style items.
   */
  async getFavoritesById(uniqueId: string): Promise<void> {
    await this.ready;
    this.scrub();

    const response = await fetch(`${FAVORITES_API_URL}/${uniqueId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-API-Key': FAVORITES_API_KEY,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Invalid or expired favorite list ID');
      }
      throw new Error(`Failed to get favorites: ${response.status}`);
    }

    const payload = await response.json();
    if (!payload || typeof payload !== 'object') {
      throw new Error('Malformed favorites payload');
    }

    // Expand any bare event UIDs into specific occurrence IDs so that
    // importing only marks the occurrences the sender favorited (rather
    // than treating the bare UID as "star every occurrence").
    const incomingEvents: string[] = payload.events || [];
    const { occurrenceIds, bareUids } = this.classifyFavoriteEventIds(incomingEvents);
    const expandedEvents = await this.expandBareEventUids(occurrenceIds, bareUids);

    const newEventIds: string[] = [];
    for (const eventId of expandedEvents) {
      if (!this.favorites.events.includes(eventId)) {
        this.favorites.events.push(eventId);
        newEventIds.push(eventId);
      }
    }
    for (const campId of payload.camps || []) {
      if (!this.favorites.camps.includes(campId)) {
        this.favorites.camps.push(campId);
      }
    }
    for (const artId of payload.art || []) {
      if (!this.favorites.art.includes(artId)) {
        this.favorites.art.push(artId);
      }
    }
    const newRslIds: string[] = [];
    for (const rslEventId of payload.rslEvents || []) {
      if (!this.favorites.rslEvents.includes(rslEventId)) {
        this.favorites.rslEvents.push(rslEventId);
        newRslIds.push(rslEventId);
      }
    }
    await this.saveFavorites();

    // Schedule notifications for newly-imported events so the user gets the
    // same reminders they would have if they had starred them themselves.
    await this.scheduleImportedEventNotifications(newEventIds);
    await this.scheduleImportedRslNotifications(newRslIds);
  }

  private async scheduleImportedEventNotifications(eventIds: string[]): Promise<void> {
    if (eventIds.length === 0) return;
    const baseIds = this.eventsFrom(eventIds);
    const events = await this.db.getEventList(baseIds);
    const selectedDay = this.db.selectedDay();
    for (const event of events) {
      const occurrence = this.selectOccurrence(event, selectedDay);
      await this.starEvent(true, event, selectedDay, occurrence, true);
    }
  }

  private async scheduleImportedRslNotifications(rslIds: string[]): Promise<void> {
    if (rslIds.length === 0) return;
    const rslEvents = await this.db.getRSLEvents(rslIds);
    for (const rslEvent of rslEvents) {
      for (const occurrence of rslEvent.occurrences) {
        if (!rslIds.includes(this.rslId(rslEvent, occurrence))) continue;
        await this.starRSLEvent(true, rslEvent, occurrence);
      }
    }
  }
}
