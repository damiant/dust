import { WorkerClass } from './worker-interface';
import {
  Art,
  Camp,
  DataMethods,
  DatasetResult,
  Day,
  Event,
  FullDataset,
  GPSSet,
  GeoRef,
  ItemList,
  Link,
  LocationHidden,
  LocationName,
  MapPoint,
  MapSet,
  Names,
  OccurrenceSet,
  Pin,
  PlacedPin,
  RSLEvent,
  Revision,
  TimeRange,
  TimeString,
} from './models';
import {
  BurningManTimeZone,
  clone,
  data_dust_events,
  getDayNameFromDate,
  getOccurrenceTimeString,
  hasValue,
  nowAtEvent,
  sameDay,
  static_dust_events,
  titlePlural,
} from '../utils/utils';
import { defaultMapRadius, distance, formatDistance, locationStringToPin, mapPointToPoint } from '../map/map.utils';
import { GpsCoord, Point, gpsToMap, mapToGps, setReferencePoints } from '../map/geo.utils';
import { set, get, clear } from 'idb-keyval';
import Fuse from 'fuse.js';

type MatchType = 'Important' | 'Match' | 'No Match';

export class DataManager implements WorkerClass {
  private events: Event[] = [];
  private camps: Camp[] = [];
  private rslEvents: RSLEvent[] = [];
  private pins: PlacedPin[] = [];
  private categories = new Set<string>();
  private campTypes = new Set<string>();
  private artTypes = new Set<string>();
  private art: Art[] = [];
  private version: string = ''; // Version of the app (used for API calls)
  private days = new Set<number>();
  private rslDays: number[] = [];
  private links: Link[] = [];
  private georeferences: GeoRef[] = [];
  private revision: Revision = { revision: 0 };
  private allEventsOld = false;
  private hasGeoPoints = false;
  private dataset: string = '';
  private timezone: string = BurningManTimeZone;
  private cache = new Map<string, TimeString>();
  private mapRadius = 5000;
  private logs: string[] = [];
  private env: any; // Environment variables dont work in web worker so we have them passed in

  // This is required for a WorkerClass
  public async doWork(method: DataMethods, args: any[]): Promise<any> {
    switch (method) {
      case DataMethods.ConsoleLog:
        const logs = clone(this.logs);
        this.logs = [];
        return logs;
      case DataMethods.Populate:
        return await this.populate(args[0], args[1], args[2], args[3]);
      case DataMethods.GetDays:
        return this.getDays(args[0]);
      case DataMethods.HasGeoPoints:
        return this.hasGeoPoints;
      case DataMethods.GetCategories:
        return Array.from(this.categories.values()).sort();
      case DataMethods.GetCampTypes:
        return Array.from(this.campTypes.values()).sort();
      case DataMethods.GetArtTypes:
        return Array.from(this.artTypes.values()).sort();
      case DataMethods.SetDataset:
        return await this.setDataset(args[0]);
      case DataMethods.GetEvents:
        return this.getEvents(args[0], args[1]);
      case DataMethods.GetLinks:
        return this.getLinks();
      case DataMethods.GetEventList:
        return this.getEventList(args[0]);
      case DataMethods.GetRSLEventList:
        return this.getRSLEventList(args[0], args[1]);
      case DataMethods.SearchRSLEvents:
        return this.searchRSLEvents(args[0], args[1]);
      case DataMethods.GetCampList:
        return this.getCampList(args[0]);
      case DataMethods.GetArtList:
        return this.getArtList(args[0]);
      case DataMethods.FindArts:
        return this.findArts(args[0], args[1], args[2], args[3]);
      case DataMethods.FindArt:
        return this.findArt(args[0]);
      case DataMethods.GpsToPoint:
        return this.gpsToPoint(args[0]);
      case DataMethods.GetMapPointGPS:
        return this.getMapPointGPS(args[0]);
      case DataMethods.SetMapPointsGPS:
        return this.setMapPointsGPS(args[0]);
      case DataMethods.GetMapPoints:
        return this.getMapPoints(args[0]);
      case DataMethods.ReadData:
        return this.read(args[0], []);
      case DataMethods.Write:
        return this.write(args[0], args[1], args[2]);
      case DataMethods.Fetch:
        return this.fetch(args[0], args[1], args[2]);
      case DataMethods.WriteData:
        return this.writeData(args[0], args[1]);
      case DataMethods.GetGPSPoints:
        return this.getGPSPoints(args[0], args[1]);
      case DataMethods.GetPins:
        return this.getPins(args[0]);
      case DataMethods.GetRSLEvents:
        return this.getRSLEvents(args[0], args[1], args[2], undefined, undefined, args[3]);
      case DataMethods.CheckEvents:
        return this.checkEvents();
      case DataMethods.SetVersion:
        return this.setVersion(args[0]);
      case DataMethods.FindEventByCamp:
        return this.findEventByCamp(args[0], args[1]);
      case DataMethods.FindEvents:
        return this.findEvents(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
      case DataMethods.FindCamps:
        return this.findCamps(args[0], args[1], args[2], args[3]);
      case DataMethods.FindAll:
        return await this.findAll(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
      case DataMethods.FindEvent:
        return this.findEvent(args[0]);
      case DataMethods.FindCamp:
        return this.findCamp(args[0]);
      case DataMethods.GetGeoReferences:
        return this.getGeoReferences();
      case DataMethods.GetCampEvents:
        return this.getCampEvents(args[0]);
      case DataMethods.GetArtEvents:
        return this.getArtEvents(args[0]);
      case DataMethods.GetCampRSLEvents:
        return await this.getRSLEvents('', undefined, undefined, undefined, args[0]);
      case DataMethods.GetCamps:
        return this.getCamps(args[0], args[1]);
      case DataMethods.Clear:
        return this.clear();
      default:
        this.consoleError(`Unknown method ${method}`);
    }
  }

  public async populate(
    dataset: string,
    locationsHidden: LocationHidden,
    env: any,
    timezone: string,
  ): Promise<DatasetResult> {
    this.dataset = dataset;
    this.timezone = timezone;
    this.env = env;
    this.events = await this.loadEvents();
    this.camps = await this.loadCamps();
    this.art = await this.loadArt();
    this.pins = await this.loadPins();
    this.links = await this.loadLinks();
    this.revision = await this.loadRevision();
    this.rslEvents = await this.loadMusic();
    this.georeferences = await this.getGeoReferences();
    await this.loadMap();
    this.init(locationsHidden);
    return {
      events: this.events.length,
      art: this.art.length,
      pins: this.pins.length,
      camps: this.camps.length,
      rsl: this.rslEvents.length,
      links: this.links.length,
      revision: this.revision.revision,
      pinTypes: await this.summarizePins(this.pins),
    };
  }

  private async setVersion(version: string) {
    this.version = version;
  }

  private async summarizePins(pins: PlacedPin[]) {
    const types: Record<string, number> = {};
    let r = await this.getGPSPoints(Names.restrooms, 'Restrooms');
    types['Restrooms'] = r.points.length;
    r = await this.getGPSPoints(Names.ice, 'Ice');
    types['Ice'] = r.points.length;
    r = await this.getGPSPoints(Names.medical, 'Medical');
    types['Medical'] = r.points.length;
    for (const pin of pins) {
      if (!types[pin.label]) {
        types[pin.label] = 0;
      }
      types[pin.label] = types[pin.label] + 1;
    }

    return types;
  }

  private async clear() {
    await clear();
  }

  private sortArt(art: Art[], top?: number) {
    art.sort((a: Art, b: Art) => {
      return a.name.localeCompare(b.name);
    });
    if (top) {
      while (art.length > top) {
        art.pop();
      }
    }
  }

  private sortArtByDistance(art: Art[], top?: number) {
    art.sort((a: Art, b: Art) => {
      return a.distance - b.distance;
    });
    if (top) {
      while (art.length > top) {
        art.pop();
      }
    }
  }

  private now(timeZone: string): Date {
    if (!this.env.simulatedTime) {
      return nowAtEvent(timeZone);
    }
    return this.env.simulatedTime; // clone(this.env.simulatedTime);
  }

  private checkEvents(): boolean {
    const today = this.now(this.timezone);
    const todayTime = today.getTime();
    let hasLiveEvents = false;
    for (const event of this.events) {
      event.old = true;
      event.happening = false;
      try {
        for (let occurrence of event.occurrence_set) {
          // This makes all events happen today
          // let start: Date = new Date(occurrence.start_time);
          // let end: Date = new Date(occurrence.end_time);
          // occurrence.start_time = this.setToday(start).toString();
          // occurrence.end_time = this.setToday(end).toString();

          if (this.allEventsOld) {
            event.old = false;
            event.happening = false;
            occurrence.old = false;
            occurrence.happening = false;
            hasLiveEvents = false;
          } else {
            const isOld = new Date(occurrence.end_time).getTime() - todayTime < 0;
            const isHappening = !isOld && new Date(occurrence.start_time).getTime() < todayTime;
            occurrence.old = isOld;
            occurrence.happening = isHappening;
            if (!occurrence.old) {
              event.old = false;
              hasLiveEvents = true;
            }
            if (occurrence.happening) {
              event.happening = true;
            }
          }
        }
      } catch (err) {
        this.consoleError(`Failed: ${event}`);
        throw err;
      }
    }
    return hasLiveEvents;
  }

  private initGeoLocation() {
    const gpsCoords: GpsCoord[] = [];
    const points: Point[] = [];
    if (this.georeferences.length < 3 && this.pins.length > 0) {
      // We can get GPS points from pins (eg SNRG)
      for (let pin of this.pins) {
        if (points.length < 3 && pin.label.toLowerCase() == 'gps' && hasValue(pin.gpsLat) && hasValue(pin.gpsLng)) {
          gpsCoords.push({ lng: pin.gpsLng!, lat: pin.gpsLat! });
          points.push({ x: pin.x, y: pin.y });
        }
      }
    } else {
      // Or from geo.json file (eg Burning Man)
      if (this.georeferences.length > 0) {
        for (let ref of [this.georeferences[0], this.georeferences[1], this.georeferences[2]]) {
          if (ref.coordinates && ref.coordinates.length > 0) {
            gpsCoords.push({ lng: ref.coordinates[0], lat: ref.coordinates[1] });
            const mp: MapPoint = { clock: ref.clock, street: ref.street };
            const pt = mapPointToPoint(mp, this.mapRadius);
            points.push(pt);
          } else {
            this.consoleLog(`geo.json data missing coordinates`);
          }
        }
      } else {
        this.consoleLog(`No data in geo.json`);
      }
    }
    this.hasGeoPoints = gpsCoords.length == 3;
    if (gpsCoords.length != 3) {
      this.consoleError(`This dataset does not have the required 3 geolocation points.`);
      return;
    }
    setReferencePoints(gpsCoords, points);
  }

  private gpsToPoint(gpsCoord: GpsCoord): Point {
    return gpsToMap(gpsCoord);
  }

  private getMapPointGPS(mapPoint: MapPoint): GpsCoord {
    const pin = mapPointToPoint(mapPoint, defaultMapRadius);
    return mapToGps(pin);
  }

  private setMapPointsGPS(mapPoints: MapPoint[]): MapPoint[] {
    for (let mapPoint of mapPoints) {
      const pin = mapPointToPoint(mapPoint, defaultMapRadius);
      if (!isNaN(pin.x)) {
        mapPoint.gps = mapToGps(pin);
      }
      this.consoleLog(`setMapPointsGPS: ${pin} ${mapPoint.gps}`);
    }
    return mapPoints;
  }

  private init(locationsHidden: LocationHidden) {
    console.time('init');
    this.cache = new Map<string, TimeString>();
    this.camps = this.camps.filter((camp) => {
      return camp.description || camp.location_string;
    });
    this.camps.sort((a: Camp, b: Camp) => {
      return a.name.localeCompare(b.name);
    });
    this.sortArt(this.art);
    this.allEventsOld = false;
    this.initGeoLocation();

    let campCache = new Map<string, Camp>();
    let pinIndex: any = {};
    let artIndex: any = {};
    let artGPS: any = {};
    let artLocationNames: any = {};
    this.campTypes = new Set<string>();
    this.artTypes = new Set<string>();

    for (let camp of this.camps) {
      const pin = this.locateCamp(camp);

      if (camp.camp_type && camp.camp_type.trim() != '') {
        const list = camp.camp_type.split(',');
        for (const type of list) {
          if (type !== 'undefined') {
            this.campTypes.add(titlePlural(type.trim()));
          }
        }
      }
      if (pin) {
        const gpsCoords = mapToGps({ x: pin.x, y: pin.y });
        camp.gpsCoord = gpsCoords;
        camp.pin = pin;
      } else {
        // If the camp has been placed with gps then use it and infer x,y
        if ((camp.pin as any)?.lat) {
          camp.gpsCoord = { lat: (camp.pin as any).lat, lng: (camp.pin as any).lng };
          camp.pin = gpsToMap(camp.gpsCoord);
        }
      }

      if (camp.imageUrl) {
        if (this.dataset.startsWith('ttitd')) {
          camp.imageUrl = `${static_dust_events}${camp.imageUrl}`;
        } else {
          camp.imageUrl = `${data_dust_events}${camp.imageUrl}`;
        }
      }
      if (locationsHidden.camps) {
        camp.location_string = locationsHidden.campMessage;
        camp.landmark = '';
      } else if (!camp.location_string) {
        camp.location_string = LocationName.Undefined;
      }
      campCache.set(camp.uid, camp);
    }

    for (let art of this.art) {
      artIndex[art.uid] = art.name;
      artLocationNames[art.uid] = art.location_string;
      if (art.art_type && art.art_type.trim() != '') {
        this.artTypes.add(titlePlural(art.art_type));
      }
      const pin = locationStringToPin(art.location_string!, this.mapRadius, undefined);
      if (pin) {
        const gpsCoords = mapToGps({ x: pin.x, y: pin.y });
        art.gpsCoords = gpsCoords;
        artGPS[art.uid] = art.gpsCoords;
        art.pin = pin;
      } else {
        // If the art has been placed with gps then use it and infer x,y
        if ((art.pin as any)?.lat) {
          art.gpsCoords = { lat: (art.pin as any).lat, lng: (art.pin as any).lng };
          art.pin = gpsToMap(art.gpsCoords);
        }
      }
      pinIndex[art.uid] = art.pin;

      if (!art.location_string) {
        if (art.art_type?.includes('Vehicle')) {
          art.location_string = LocationName.Mobile;
        } else {
          art.location_string = LocationName.Unplaced;
        }
        if (art.pin?.x) {
          art.location_string = undefined; // Its placed with x,y
        }
      }

      if (locationsHidden.art) {
        art.location_string = locationsHidden.artMessage;
      }
    }

    this.days = new Set<number>();
    this.rslDays = [];
    this.categories = new Set<string>();

    this.allEventsOld = !this.checkEvents();

    for (let event of this.events) {
      let allLong = true;
      for (let label of event.event_type.label.split(',')) {
        label = label.trim();
        this.categories.add(label);
      }
      if (event.imageUrl) {
        event.imageUrl = `${data_dust_events}${event.imageUrl}`;
      }
      if (event.hosted_by_camp) {
        const camp = campCache.get(event.hosted_by_camp);
        if (camp) {
          event.camp = camp.name;
          event.location = camp.location_string!;
          event.facing = camp.facing;
        }
        const placed = camp?.pin;

        let pin;

        if (placed) {
          event.pin = placed;
          pin = placed;
        } else {
          pin = locationStringToPin(event.location, this.mapRadius, event.facing);
        }

        if (locationsHidden.camps) {
          event.location = locationsHidden.campMessage;
          event.pin = undefined;
          pin = undefined;
        }

        if (pin) {
          event.gpsCoords = mapToGps({ x: pin.x, y: pin.y });
        } else {
          if (!this.env.production) {
            this.consoleError(`Unable to find camp ${event.hosted_by_camp} for event ${event.title} ${placed}`);
          }
        }
      } else if (event.other_location) {
        event.camp = event.other_location;
        if (event.camp.toLowerCase().includes('center camp')) {
          event.location = '6:00 & A';
          const pin = locationStringToPin(event.location, this.mapRadius, undefined);
          const gpsCoords = mapToGps({ x: pin!.x, y: pin!.y });
          event.gpsCoords = gpsCoords;
        } else {
          // If its a hand crafted name then we're out of luck finding an address
          //console.warn(`${event.title} hosted at ${event.camp}`);
        }
      } else if (event.located_at_art) {
        event.camp = artIndex[event.located_at_art];
        try {
          event.gpsCoords = artGPS[event.located_at_art];
          event.location = artLocationNames[event.located_at_art];
          const placed = pinIndex[event.located_at_art];
          let pin = undefined;

          if (placed) {
            event.pin = placed;
            pin = placed;
          }

          if (pin) {
            const gpsCoords = mapToGps({ x: pin.x, y: pin.y });
            event.gpsCoords = gpsCoords;
          } else {
            if (!this.env.production) {
              this.consoleError(`Unable to find art ${event.located_at_art} for event ${event.title} ${placed}`);
            }
          }
        } catch {
          this.consoleError(`Failed GPS: ${event.title} hosted at art ${event.located_at_art}`);
        }
      } else {
        this.consoleError(`no location ${JSON.stringify(event)}`);
      }

      for (let [i, occurrence] of event.occurrence_set.entries()) {
        let start: Date = new Date(occurrence.start_time);
        let end: Date = new Date(occurrence.end_time);
        this.addDay(start);

        if (this.hoursBetween(start, end) <= 6) {
          allLong = false;
        }

        // Change midnight to 11:59 so that it works with the sameday function
        if (occurrence.end_time.includes('T00:00:00')) {
          const t = occurrence.start_time.split('T');
          occurrence.end_time = t[0] + 'T23:59:00';
          end = new Date(occurrence.end_time);
        }
        const res = this.getOccurrenceTimeStringCached(start, end, undefined);
        occurrence.longTimeString = res ? res.long : 'Unknown';
        if (i == 0) {
          event.start = new Date(occurrence.start_time);
          if (res) {
            event.timeString = res.short;
            event.longTimeString = res.long;
          }
        }
      }

      event.all_day = allLong;
    }

    try {
      for (const rslEvent of this.rslEvents) {
        this.addRSLDay(this.asDateTime(rslEvent.day));
      }
    } catch (err) {
      this.consoleError(`Failed to add RSL days: ${err}`);
    }

    this.cache = new Map<string, TimeString>();
    console.timeEnd('init');
  }

  private asDateTime(s: string): Date {
    const t = s.split('-');
    return new Date(parseInt(t[0]), parseInt(t[1]) - 1, parseInt(t[2]));
  }

  private locateCamp(camp: Camp): Pin | undefined {
    if (!camp.location_string) return undefined;
    return locationStringToPin(camp.location_string, this.mapRadius, camp.facing);
  }

  private log(message: string) {
    this.logs.push(message);
  }

  public async setDataset(ds: FullDataset): Promise<DatasetResult | undefined> {
    let result: DatasetResult | undefined;
    try {
      this.dataset = ds.dataset;
      this.timezone = ds.timezone;
      this.events = await this.loadData(ds.events);
      this.camps = await this.loadData(ds.camps);
      this.art = await this.loadData(ds.art);
      this.links = await this.loadData(ds.links);
      this.pins = await this.loadData(ds.pins);
      this.rslEvents = await this.loadData(ds.rsl);
      const map = await this.loadData(ds.map);

      this.consoleLog(
        `Setting dataset in worker: ${this.events.length} events, ${this.camps.length} camps, ${this.art.length} art, ${!!map} map ${this.pins.length} pins`,
      );
      result = {
        events: this.events.length,
        camps: this.camps.length,
        art: this.art.length,
        pins: this.pins.length,
        links: this.links.length,
        rsl: this.rslEvents.length,
        revision: this.revision.revision,
        pinTypes: await this.summarizePins(this.pins),
      };
    } catch (err) {
      this.consoleError(`Failed to setDataset: ${err}`);
      throw new Error(`setDataset: ${err}`);
    } finally {
      this.init(ds.locationAvailable);
    }
    return result;
  }

  public getEvents(idx: number, count: number): Event[] {
    const result: Event[] = [];
    let i = idx;
    while (i < this.events.length && result.length < count) {
      result.push(this.events[i]);
      i++;
    }
    return result;
  }

  public getLinks(): Link[] {
    return this.links;
  }

  public getEventList(ids: string[]): Event[] {
    const result: Event[] = [];
    for (let event of this.events) {
      if (ids.includes(event.uid)) {
        result.push(event);
      }
    }
    this.sortEvents(result);
    return result;
  }

  public async getRSLEventList(ids: string[], isHistorical: boolean): Promise<RSLEvent[]> {
    if (ids.length == 0) return [];
    return await this.getRSLEvents('', undefined, undefined, ids, undefined, isHistorical);
  }

  public getCampList(ids: string[]): Camp[] {
    const result: Camp[] = [];
    for (let camp of this.camps) {
      if (ids.includes(camp.uid)) {
        result.push(camp);
      }
    }
    this.sortCamps(result);
    return result;
  }

  public getArtList(ids: string[]): Art[] {
    const result: Art[] = [];
    for (let art of this.art) {
      if (ids.includes(art.uid)) {
        result.push(art);
      }
    }
    this.sortArt(result);
    return result;
  }

  public getCamps(idx: number, count: number): Camp[] {
    const result: Camp[] = [];
    let i = idx;
    while (i < this.camps.length && result.length < count) {
      result.push(this.camps[i]);
      i++;
    }
    this.sortCamps(result);
    return result;
  }

  public findEvent(uid: string): Event | undefined {
    for (let event of this.events) {
      if (event.uid == uid) {
        return event;
      }
    }
    return undefined;
  }

  public findCamp(uid: string): Camp | undefined {
    for (let camp of this.camps) {
      if (camp.uid == uid) {
        return camp;
      }
    }
    return undefined;
  }

  public findArt(uid: string): Art | undefined {
    for (let art of this.art) {
      if (art.uid == uid) {
        if (!art.images) {
          art.images = [];
        }
        for (let image of art.images) {
          image.ready = false;
        }
        return art;
      }
    }
    return undefined;
  }

  private nullOrEmpty(s: string | undefined): boolean {
    return s == undefined || s == '';
  }

  public async searchRSLEvents(query: string, isHistorical: boolean): Promise<Day[]> {
    function unique(value: string, index: number, data: string[]) {
      return data.indexOf(value) === index;
    }

    const events = await this.getRSLEvents(query, undefined, undefined, [], undefined, isHistorical);
    const found = events.map((e) => e.day).filter(unique);
    const days = this.getDays(Names.rsl);
    const result: Day[] = [];
    for (let day of days) {
      const d = new Date(day.date);
      if (found.includes(this.toRSLDateFormat(d))) {
        result.push(day);
      }
    }
    return result;
  }

  private toRSLDateFormat(day: Date): string {
    const offset = day.getTimezoneOffset();
    day = new Date(day.getTime() - offset * 60 * 1000);
    return day.toISOString().split('T')[0];
  }

  public async getRSLEvents(
    query: string,
    day: Date | undefined,
    coords: GpsCoord | undefined,
    ids?: string[] | undefined,
    campId?: string | undefined,
    isHistorical?: boolean,
  ): Promise<RSLEvent[]> {
    try {
      const events: RSLEvent[] = await this.read(this.getId(Names.rsl), []);
      const result: RSLEvent[] = [];
      query = this.scrubQuery(query);
      const fDay = day ? this.toRSLDateFormat(day) : undefined;
      const today = this.now(this.timezone);
      const campPins: any = {};
      for (let event of events) {
        // Place RSL Events at the camp pin
        if (event.campId) {
          const pin = campPins[event.campId];
          if (pin) {
            event.pin = pin;
          } else {
            const camps = this.getCampList([event.campId]);
            if (!event.pin) {
              event.pin = camps && camps.length > 0 ? camps[0].pin : undefined;
              Object.defineProperty(campPins, event.campId, { value: event.pin, enumerable: true });
            }
          }
        }

        let match = false;
        if (campId) {
          match = event.campId == campId && this.nullOrEmpty(event.artCar);
        } else {
          match = this.rslEventContains(event, query) && (event.day == fDay || !!ids || !fDay);
        }

        if (match) {
          let allOld = true;
          for (let occurrence of event.occurrences) {
            occurrence.old = new Date(occurrence.endTime).getTime() - today.getTime() < 0;
            if (!occurrence.old) {
              allOld = false;
            }
          }
          if (ids && ids.length > 0) {
            event.occurrences = event.occurrences.filter((o) => {
              const id = `${event.uid}-${o.id}`;
              return ids.includes(id);
            });
            if (event.occurrences.length == 0) {
              allOld = true; // Don't include
            }
          }

          // If allOld is true then all times have ended
          if (!allOld || isHistorical) {
            event.distance = distance(coords!, event.gpsCoords!);
            event.distanceInfo = formatDistance(event.distance);
            result.push(event);
          }
        }
      }
      if (coords) {
        this.sortRSLEventsByDistance(result);
      } else if (campId) {
        this.sortRSLEventsByDay(result);
      } else {
        this.sortRSLEventsByName(result);
      }

      return result;
    } catch (err) {
      this.consoleError(`getRSLEvents returned an error ${err}`);
      return [];
    }
  }

  private scrubQuery(query: string): string {
    if (query) {
      query = query.toLowerCase().trim();
    }
    return query;
  }

  private sortRSLEventsByDay(events: RSLEvent[]) {
    events.sort((a: RSLEvent, b: RSLEvent) => {
      return new Date(a.day).getTime() - new Date(b.day).getTime();
    });
  }
  private sortRSLEventsByName(events: RSLEvent[]) {
    events.sort((a: RSLEvent, b: RSLEvent) => {
      return a.camp.localeCompare(b.camp);
    });
  }
  private sortRSLEventsByDistance(events: RSLEvent[]) {
    events.sort((a: RSLEvent, b: RSLEvent) => {
      return a.distance - b.distance;
    });
  }

  private rslEventContains(event: RSLEvent, query: string): boolean {
    if (query == '') return true;
    if (event.camp.toLowerCase().includes(query)) return true;
    if (event.artCar && event.artCar.toLowerCase().includes(query)) return true;
    if (event.title && event.title.toLowerCase().includes(query)) return true;
    if (event.location.toLowerCase().includes(query)) return true;
    for (let occurrence of event.occurrences) {
      if (occurrence.who.toLowerCase().includes(query)) {
        event.occurrences = event.occurrences.filter((o) => o.who.toLowerCase().includes(query));
        return true;
      }
      if (occurrence.timeRange.toLowerCase().includes(query)) {
        event.occurrences = event.occurrences.filter((o) => o.timeRange.toLowerCase().includes(query));
        return true;
      }
    }
    return false;
  }

  private isClockString(str: string): boolean {
    const regex = /^[0-9:&]+$/;
    return regex.test(str);
  }

  public async findAll(
    query: string,
    day: Date | undefined,
    category: string,
    coords: GpsCoord | undefined,
    timeRange: TimeRange | undefined,
    allDay: boolean,
    showPast: boolean,
    top: number,
  ): Promise<ItemList> {
    const events = this.findEvents(query, day, category, coords, timeRange, allDay, showPast, top);
    const art = this.findArts(query, coords, top);
    const camps = this.findCamps(query, coords, top);
    const medical = await this.getMapSet(Names.medical, 'Medical', 'Medical');
    const ice = await this.getMapSet(Names.ice, 'Ice', 'Ice');
    const restrooms = await this.getMapSet(Names.restrooms, 'Block of restrooms', 'Restrooms');
    medical.points = this.sortByDistance(medical.points, coords, this.isMedicalQuery(query) ? 1 : 0);
    ice.points = this.sortByDistance(ice.points, coords, this.isIceQuery(query) ? 1 : 0);
    restrooms.points = this.sortByDistance(restrooms.points, coords, this.isRestroomQuery(query) ? 3 : 0);
    return {
      events,
      camps,
      art,
      restrooms,
      medical,
      ice,
    };
  }

  private async getMapSet(name: Names, title: string, pinType: string): Promise<MapSet> {
    const v = await this.getGPSPoints(name, title);
    if (v.points.length == 0) {
      return await this.getPins(pinType);
    } else {
      return v;
    }
  }

  private isRestroomQuery(query: string): boolean {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      q.includes('rest') || q.includes('toilet') || q.includes('porta') || q.includes('potty') || q.includes('bath')
    );
  }

  private isMedicalQuery(query: string): boolean {
    if (!query) return true;
    const q = query.toLowerCase();
    return q.includes('med') || q.includes('aid');
  }

  private isIceQuery(query: string): boolean {
    if (!query) return true;
    const q = query.toLowerCase();
    return q.includes('ice');
  }

  public findEventByCamp(campId: string, title: string): Event[] {
    const events = this.findEvents('', undefined, '', undefined, undefined, false, false);
    return events.filter((e) => e.hosted_by_camp == campId && e.title.toLowerCase() == title.toLowerCase());
  }

  public findEvents(
    query: string,
    day: Date | undefined,
    category: string,
    coords: GpsCoord | undefined,
    timeRange: TimeRange | undefined,
    allDay: boolean,
    showPast: boolean,
    top?: number,
  ): Event[] {
    const result: Event[] = [];
    if (query && !this.isClockString(query)) {
      query = this.scrubQuery(query);
      let events = this.events;
      if (day || category) {
        events = this.events.filter(
          (event) => this.onDay(day, event, timeRange, showPast) && this.eventIsCategory(category, event),
        );
      }
      const fuse = new Fuse(events, { keys: ['title', 'description', 'camp', 'location'], ignoreLocation: true });
      const found = fuse.search(query, { limit: top ? top : 10 });
      for (let c of found) {
        result.push(c.item);
      }
      return result;
    }

    for (let event of this.events) {
      const match = this.eventContains(query, event, allDay);
      if (match != 'No Match' && this.eventIsCategory(category, event)) {
        const occurrences = this.onDayList(day, event, timeRange, showPast);
        const timeStrings = this.getTimeStrings(day, occurrences);

        let first = true;
        for (const timeString of timeStrings) {
          let e = first ? event : JSON.parse(JSON.stringify(event));
          first = false;
          e.start = timeString.start;
          e.all_day = this.hoursBetween(timeString.start, timeString.end) > 6;
          e.timeString = timeString.short;
          e.longTimeString = timeString.long;
          e.event_type.label = e.event_type.label.replace(/,/g, ', ');
          e.distance = distance(coords!, e.gpsCoords);
          e.distanceInfo = formatDistance(e.distance);
          if (match == 'Important') {
            result.unshift(e);
          } else {
            result.push(e);
          }
        }
      }
    }

    if (coords) {
      this.sortEventsByDistance(result, top);
    } else {
      this.sortEvents(result, top);
    }

    return result;
  }

  private sortEvents(events: Event[], top?: number) {
    events.sort((a: Event, b: Event) => {
      if (!!a.all_day) {
        return 99999; // All day events go to the bottom
      } else if (!!b.all_day) {
        return -99999;
      }
      return a.start.getTime() - b.start.getTime();
    });
    if (top) {
      while (events.length > top) {
        events.pop();
      }
    }
  }

  private sortEventsByDistance(events: Event[], top?: number) {
    events.sort((a: Event, b: Event) => {
      return (a.happening ? 0 : 1) - (b.happening ? 0 : 1) || a.distance - b.distance;
    });
    if (top) {
      while (events.length > top) {
        events.pop();
      }
    }
  }

  private sortByDistance(points: MapPoint[], gps: GpsCoord | undefined, top: number): MapPoint[] {
    if (top == 0) return [];
    if (!gps) return points;
    points.sort((a: MapPoint, b: MapPoint) => {
      if (!a.gps || !b.gps) {
        return -1;
      }
      return distance(gps, b.gps) - distance(gps, a.gps);
    });
    return points.slice(-top);
  }

  private sortCamps(camps: Camp[], top?: number) {
    camps.sort((a: Camp, b: Camp) => {
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
    if (top) {
      while (camps.length > top) {
        camps.pop();
      }
    }
  }

  private sortCampsByDistance(camps: Camp[], top?: number) {
    camps.sort((a: Camp, b: Camp) => {
      return a.distance - b.distance;
    });
    if (top) {
      while (camps.length > top) {
        camps.pop();
      }
    }
  }

  public getCampEvents(campId: string): Event[] {
    const result: Event[] = [];

    for (let event of this.events) {
      if (event.hosted_by_camp == campId) {
        result.push(event);
      }
    }
    this.sortEvents(result);
    return result;
  }

  public getArtEvents(artId: string): Event[] {
    const result: Event[] = [];

    for (let event of this.events) {
      if (event.located_at_art == artId) {
        result.push(event);
      }
    }
    this.sortEvents(result);
    return result;
  }

  public findCamps(query: string, coords?: GpsCoord, top?: number, campType?: string): Camp[] {
    const result: Camp[] = [];
    if (query && !this.isClockString(query)) {
      query = this.scrubQuery(query);

      const fuse = new Fuse(this.camps, { keys: ['name', 'description', 'location_string'], ignoreLocation: true });
      const found = fuse.search(query, { limit: top ? top : 10 });
      for (let c of found) {
        result.push(c.item);
      }
      return result;
    }
    for (let camp of this.camps) {
      if (coords) {
        camp.distance = distance(coords, camp.gpsCoord);
        camp.distanceInfo = formatDistance(camp.distance);
      } else {
        camp.distanceInfo = '';
      }
      const match = this.campMatches(query, camp, campType);
      switch (match) {
        case 'Important':
          result.unshift(camp);
          break;
        case 'Match':
          result.push(camp);
          break;
      }
    }
    if (!query || query.length == 0) {
      if (coords) {
        this.sortCampsByDistance(result, top);
      } else {
        this.sortCamps(result, top);
      }
    }

    return result;
  }

  private campMatches(query: string, camp: Camp, campType?: string): MatchType {
    let result: MatchType = 'No Match';
    if (query == '' || !query) {
      result = 'Match';
    } else {
      if (camp.name.toLowerCase().includes(query) || camp.location_string?.toLowerCase().includes(query)) {
        result = 'Important';
      } else {
        if (camp.description?.toLowerCase().includes(query)) {
          result = 'Match';
        }
      }
    }
    if (hasValue(campType)) {
      result = this.typeMatch(camp.camp_type, campType) ? 'Match' : 'No Match';
    }
    return result;
  }

  public findArts(query: string | undefined, coords: GpsCoord | undefined, top?: number, artType?: string): Art[] {
    const result: Art[] = [];
    if (query && !this.isClockString(query)) {
      query = this.scrubQuery(query);
      const fuse = new Fuse(this.art, {
        keys: ['name', 'description', 'location_string', 'artist'],
        ignoreLocation: true,
      });
      const found = fuse.search(query, { limit: top ? top : 10 });
      for (let c of found) {
        result.push(c.item);
      }
      return result;
    }
    for (let art of this.art) {
      if (coords) {
        art.distance = distance(coords, art.gpsCoords);
        art.distanceInfo = formatDistance(art.distance);
      }
      let match = this.artMatches(query ? query.toLowerCase() : '', art);

      if (hasValue(artType)) {
        if (!this.typeMatch(art.art_type, artType)) {
          match = 'No Match';
        }
      }

      if (match !== 'No Match') {
        if (match == 'Important') {
          result.unshift(art);
        } else {
          result.push(art);
        }
      }
    }
    if (!query || query == '') {
      if (coords) {
        this.sortArtByDistance(result, top);
      } else {
        this.sortArt(result);
      }
    }
    return result;
  }

  private typeMatch(value: string | undefined, type: string | undefined): boolean {
    if (!value) return false;
    return titlePlural(value) === type;
  }

  private artMatches(query: string, art: Art): MatchType {
    if (query == '') return 'Match';
    if (art.name.toLowerCase().includes(query) || art.location_string?.toLowerCase().includes(query)) {
      return 'Important';
    }
    if (art.description?.toLowerCase().includes(query)) {
      return 'Match';
    }
    return 'No Match';
  }

  private eventIsCategory(category: string, event: Event): boolean {
    if (category === '') return true;
    if (!event.event_type?.label) return true;
    if (category === 'No Recurring') {
      return event.occurrence_set.length === 1 && !event.all_day;
    }
    return event.event_type?.label.includes(category);
  }

  private getTimeStrings(day: Date | undefined, occurrences: OccurrenceSet[]): TimeString[] {
    const result: TimeString[] = [];
    for (let occurrence of occurrences) {
      const res = this.getOccurrenceTimeStringCached(
        new Date(occurrence.start_time),
        new Date(occurrence.end_time),
        day,
      );
      if (res) {
        if (!day) {
          return [res];
        }
        result.push(res);
      }
      //
    }
    return result;
  }

  private getOccurrenceTimeStringCached(start: Date, end: Date, day: Date | undefined): TimeString | undefined {
    const key = `${start.getTime()}-${end.getTime()}-${day}`;
    if (!this.cache.has(key)) {
      const value = getOccurrenceTimeString(start, end, day, this.timezone);
      if (value) {
        this.cache.set(key, value);
      }
      return value;
    }
    return this.cache.get(key);
  }

  private hoursBetween(d1: any, d2: any): number {
    return Math.abs(d1 - d2) / 36e5;
  }

  public getDays(name: Names): Day[] {
    const result: Day[] = [];
    const days = name == Names.rsl ? this.rslDays : this.days.values();
    for (let day of days) {
      const date = new Date(day);
      result.push({ name: getDayNameFromDate(date).substring(0, 3), dayName: date.getDate().toString(), date });
    }
    result.sort((a, b) => {
      return a.date.getTime() - b.date.getTime();
    });
    return result;
  }

  private eventContains(terms: string, event: Event, allDay: boolean): MatchType {
    if (!allDay) {
      if (event.all_day) return 'No Match';
    }
    if (terms == '' || !terms) return 'Match';
    if (
      event.title.toLowerCase().includes(terms) ||
      event.camp?.toLowerCase().includes(terms) ||
      event.location?.toLowerCase().includes(terms)
    ) {
      return 'Important';
    }
    if (event.description.toLowerCase().includes(terms)) {
      return 'Match';
    }

    return 'No Match';
  }

  private onDay(day: Date | undefined, event: Event, timeRange: TimeRange | undefined, showPast: boolean): boolean {
    if (!day && !timeRange) return true;
    for (let occurrence of event.occurrence_set) {
      const start = new Date(occurrence.start_time);
      const end = new Date(occurrence.end_time);

      if (day) {
        if ((!occurrence.old || showPast) && (sameDay(start, day) || sameDay(end, day))) {
          return true;
        }
      } else if (timeRange) {
        // if event starts after range start and ends before range end
        // if event is before timeRange.start then not now
        // if event starts after timeRange.end then not now

        if (start < timeRange.start && end > timeRange.end) {
          return true; // Event is overlapping time range
        }
        if (start > timeRange.start && start < timeRange.end) {
          return true; // Event is overlapping the start of the time range
        }
        if (end > timeRange.start && end < timeRange.end) {
          return true; // Event is overlapping the end of the time range
        }
      }
    }
    return false;
  }

  private onDayList(
    day: Date | undefined,
    event: Event,
    timeRange: TimeRange | undefined,
    showPast: boolean,
  ): OccurrenceSet[] {
    if (!day && !timeRange) return event.occurrence_set;
    const result: OccurrenceSet[] = [];
    for (let occurrence of event.occurrence_set) {
      const start = new Date(occurrence.start_time);
      const end = new Date(occurrence.end_time);

      if (day) {
        if ((!occurrence.old || showPast) && (sameDay(start, day) || sameDay(end, day))) {
          result.push(occurrence);
        }
      } else if (timeRange) {
        // if event starts after range start and ends before range end
        // if event is before timeRange.start then not now
        // if event starts after timeRange.end then not now

        if (start < timeRange.start && end > timeRange.end) {
          result.push(occurrence); // Event is overlapping time range
        }
        if (start > timeRange.start && start < timeRange.end) {
          result.push(occurrence); // Event is overlapping the start of the time range
        }
        if (end > timeRange.start && end < timeRange.end) {
          result.push(occurrence); // Event is overlapping the end of the time range
        }
      }
    }
    return result;
  }

  private addDay(date: Date) {
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    this.days.add(day);
  }

  private addRSLDay(date: Date) {
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    if (!this.rslDays.includes(day)) {
      this.rslDays.push(day);
    }
  }

  private async loadEvents(): Promise<Event[]> {
    return await this.read(this.getId(Names.events), []);
  }

  private async loadData(uri: string): Promise<any> {
    try {
      const res = await fetch(uri);
      return await res.json();
    } catch {
      this.consoleError(`Worker fetch Failed to load ${uri}`);
      return [];
    }
  }

  private consoleLog(message: string) {
    this.log(message);
  }

  private consoleError(message: string) {
    this.log(`[error]${message}`);
  }

  public async getGPSPoints(name: string, title: string): Promise<MapSet> {
    try {
      const def: GPSSet = { title: '', description: '', points: [] };
      const data: GPSSet = await this.read(this.getId(name as any), def);
      const result: MapSet = { title: data.title, description: data.description, points: [] };

      if (!data.points) return result;
      for (let gps of data.points) {
        const point = gpsToMap(gps);
        const mapPoint: MapPoint = {
          street: '',
          clock: '',
          x: point.x,
          y: point.y,
          gps: clone(gps),
          info: { title, location: '', subtitle: '' },
        };
        result.points.push(mapPoint);
      }
      return result;
    } catch (err) {
      this.consoleLog(`${err}`);
      return { title: '', description: '', points: [] };
    }
  }

  private parsePin(pin: string): Pin {
    if (hasValue(pin)) {
      return JSON.parse(pin);
    }
    return { x: 0, y: 0 };
  }

  private fixPins(camps: Camp[]) {
    try {
      for (const camp of camps) {
        camp.pin = this.parsePin(camp.pin as any);
      }
    } catch {
      this.consoleError(`Failed to fix pins on camps`);
    }
  }

  private fixArtPins(art: Art[]) {
    try {
      for (const item of art) {
        item.pin = this.parsePin(item.pin as any);
      }
    } catch {
      this.consoleError(`Failed to fix pins on art`);
    }
  }

  public async write(key: string, url: string, timeout: number): Promise<any> {
    try {
      const response = await webFetchWithTimeout(url, { headers: { 'app-version': this.version } }, timeout);
      const json = await response.json();
      if (key.includes(Names.camps)) {
        this.fixPins(json);
      }
      if (key.includes(Names.art)) {
        this.fixArtPins(json);
      }
      await set(key, json);
      return json;
    } catch (err) {
      this.consoleError(`Failed write ${key} (url=${url})${err}`);
      throw new Error(`write ${key} ${url} failed`);
    }
  }

  public async fetch(key: string, url: string, timeout: number): Promise<any> {
    try {
      const response = await webFetchWithTimeout(url, { headers: { 'app-version': this.version } }, timeout);
      const json = await response.json();
      return json;
    } catch (err) {
      this.consoleError(`Failed fetch ${key} (url=${url})${err}`);
    }
  }

  public async writeData(key: string, data: any): Promise<void> {
    await set(key, data);
  }

  public async read(key: string, defaultValue: any): Promise<any> {
    const value = await get(key);
    if (!value) return defaultValue;
    return value;
  }

  public async getMapPoints(name: string): Promise<MapSet> {
    try {
      const def: MapSet = { title: '', description: '', points: [] };
      const mapSet: MapSet = await this.read(this.getId(name as any), def);
      for (let point of mapSet.points) {
        point.gps = this.getMapPointGPS(point);
      }
      return mapSet;
    } catch {
      return { title: '', description: '', points: [] };
    }
  }

  public async getPins(pinType: string): Promise<MapSet> {
    try {
      const pins: PlacedPin[] = await this.read(this.getId(Names.pins), []);
      const mapSet: MapSet = { title: pinType, description: '', points: [] };
      for (let pin of pins) {
        const mp: MapPoint = { x: pin.x, y: pin.y, street: '', clock: '' };
        mp.gps = this.getMapPointGPS(mp);
        // Pins with just GPS need this (eg imported from KML)
        if (pin.gpsLat && pin.gpsLng) {
          mp.gps = { lat: pin.gpsLat, lng: pin.gpsLng };
          const pt = gpsToMap(mp.gps);
          mp.x = pt.x;
          mp.y = pt.y;
        }
        let match = pin.label == pinType;
        if (pinType == 'other' && !['GPS', 'Restrooms', 'Medical'].includes(pin.label)) {
          mp.info = { title: pin.label, location: '', subtitle: '', bgColor: 'accent' };
          if (pin.label.includes('Shuttle')) {
            mp.info.label = '@';
          } else {
            mp.info.label = pin.label.substring(0, 1);
          }
          match = true;
        }
        if (match) {
          mapSet.points.push(mp);
        }
      }
      return mapSet;
    } catch {
      return { title: pinType, description: '', points: [] };
    }
  }

  public async getGeoReferences(): Promise<GeoRef[]> {
    try {
      return this.read(this.getId(Names.geo), []);
    } catch {
      return [];
    }
  }

  private getId(name: Names): string {
    return `${this.dataset}-${name}`;
  }

  private async loadCamps(): Promise<Camp[]> {
    return await this.read(this.getId(Names.camps), []);
  }

  private async loadArt(): Promise<Art[]> {
    return this.read(this.getId(Names.art), []);
  }

  private async loadPins(): Promise<PlacedPin[]> {
    try {
      return this.read(this.getId(Names.pins), []);
    } catch {
      return [];
    }
  }

  private async loadLinks(): Promise<Link[]> {
    try {
      return this.read(this.getId(Names.links), []);
    } catch {
      return [];
    }
  }

  private async loadMap(): Promise<Link[]> {
    try {
      return this.read(this.getId(Names.map), []);
    } catch {
      return [];
    }
  }

  private async loadMusic(): Promise<RSLEvent[]> {
    try {
      return this.read(this.getId(Names.rsl), []);
    } catch {
      return [];
    }
  }

  private async loadRevision(): Promise<Revision> {
    return this.read(this.getId(Names.revision), []);
  }
}

async function webFetchWithTimeout(url: string, options = {}, timeout: number = 5000) {
  if (!AbortSignal.timeout) {
    return await fetch(url, {
      cache: 'no-cache',
      ...options,
    });
  }
  const signal = AbortSignal.timeout(timeout);
  const response = await fetch(url, {
    cache: 'no-cache',
    ...options,
    signal,
  });
  return response;
}
