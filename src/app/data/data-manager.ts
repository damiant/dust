import { WorkerClass } from './worker-interface';
import { Art, Camp, DataMethods, DatasetResult, Day, Event, FullDataset, GPSSet, GeoRef, Link, LocationName, MapPoint, MapSet, Pin, PlacedPin, RSLEvent, Revision, TimeRange, TimeString } from './models';
import { BurningManTimeZone, CurrentYear, getDayNameFromDate, getOccurrenceTimeString, now, sameDay } from '../utils/utils';
import { defaultMapRadius, distance, formatDistance, locationStringToPin, mapPointToPoint } from '../map/map.utils';
import { GpsCoord, Point, gpsToMap, mapToGps, setReferencePoints } from '../map/geo.utils';
import { environment } from 'src/environments/environment';

interface TimeCache {
    [index: string]: TimeString | undefined;
}

export class DataManager implements WorkerClass {
    private events: Event[] = [];
    private camps: Camp[] = [];
    private pins: PlacedPin[] = [];
    private categories: string[] = [];
    private art: Art[] = [];
    private days: number[] = [];
    private links: Link[] = [];
    private georeferences: GeoRef[] = [];
    private revision: Revision = { revision: 0 };
    private allEventsOld = false;
    private dataset: string = '';
    private cache: TimeCache = {};
    private mapRadius = 5000;

    // This is required for a WorkerClass
    public async doWork(method: DataMethods, args: any[]): Promise<any> {
        switch (method) {
            case DataMethods.Populate: return await this.populate(args[0], args[1]);
            case DataMethods.GetDays: return this.getDays();
            case DataMethods.GetPotties: return this.getPotties();
            case DataMethods.GetCategories: return this.categories;
            case DataMethods.SetDataset: return await this.setDataset(args[0]);
            case DataMethods.GetEvents: return this.getEvents(args[0], args[1]);
            case DataMethods.GetLinks: return this.getLinks();
            case DataMethods.GetEventList: return this.getEventList(args[0]);
            case DataMethods.GetRSLEventList: return this.getRSLEventList(args[0]);
            case DataMethods.SearchRSLEvents: return this.searchRSLEvents(args[0]);
            case DataMethods.GetCampList: return this.getCampList(args[0]);
            case DataMethods.GetArtList: return this.getArtList(args[0]);
            case DataMethods.FindArts: return this.findArts(args[0], args[1]);
            case DataMethods.FindArt: return this.findArt(args[0]);
            case DataMethods.GpsToPoint: return this.gpsToPoint(args[0]);
            case DataMethods.GetMapPointGPS: return this.getMapPointGPS(args[0]);
            case DataMethods.SetMapPointsGPS: return this.setMapPointsGPS(args[0]);
            case DataMethods.GetMapPoints: return this.getMapPoints(args[0]);
            case DataMethods.GetGPSPoints: return this.getGPSPoints(args[0], args[1]);
            case DataMethods.GetPins: return this.getPins(args[0]);
            case DataMethods.GetRSLEvents: return this.getRSLEvents(args[0], args[1], args[2], undefined, undefined);
            case DataMethods.CheckEvents: return this.checkEvents(args[0]);
            case DataMethods.FindEvents: return this.findEvents(args[0], args[1], args[2], args[3], args[4], args[5]);
            case DataMethods.FindCamps: return this.findCamps(args[0], args[1]);
            case DataMethods.FindEvent: return this.findEvent(args[0]);
            case DataMethods.FindCamp: return this.findCamp(args[0]);
            case DataMethods.GetGeoReferences: return this.getGeoReferences();
            case DataMethods.GetCampEvents: return this.getCampEvents(args[0]);
            case DataMethods.GetCampRSLEvents: return await this.getRSLEvents('', undefined, undefined, undefined, args[0]);
            case DataMethods.GetCamps: return this.getCamps(args[0], args[1]);
            default: console.error(`Unknown method ${method}`);
        }
    }

    public async populate(dataset: string, hideLocations: boolean): Promise<number> {
        this.dataset = dataset;
        this.events = await this.loadEvents();
        this.camps = await this.loadCamps();
        this.art = await this.loadArt();
        this.pins = await this.loadPins();
        this.links = await this.loadLinks();
        this.revision = await this.loadRevision();
        this.georeferences = await this.getGeoReferences();
        this.init(hideLocations);
        return this.revision.revision;
    }

    private sortArt(art: Art[]) {
        art.sort((a: Art, b: Art) => { return a.name.localeCompare(b.name); });
    }

    private sortArtByDistance(art: Art[]) {
        art.sort((a: Art, b: Art) => { return a.distance - b.distance; });
    }

    private checkEvents(day?: Date): boolean {
        const today = now();
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
                        const isOld = (new Date(occurrence.end_time).getTime() - today.getTime() < 0);
                        const isHappening = !isOld && (new Date(occurrence.start_time).getTime() < today.getTime());
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
                console.error('Failed', event);
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
                if (points.length < 3 && pin.label.toLowerCase() == 'gps' && pin.gps) {
                    gpsCoords.push({ lng: pin.gps.lng, lat: pin.gps.lat });
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
                        console.info(`geo.json data missing coordinates`);
                    }
                }
            } else {
                console.info(`No data in geo.json`);
            }
        }
        if (gpsCoords.length != 3) {
            console.error(`This dataset does not have the required 3 geolocation points.`);
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
            console.log('setMapPointsGPS', pin, mapPoint.gps);
        }
        return mapPoints;
    }

    private init(hideLocations: boolean) {
        console.time('init');
        this.cache = {};
        this.camps = this.camps.filter((camp) => { return camp.description || camp.location_string });
        this.camps.sort((a: Camp, b: Camp) => { return a.name.localeCompare(b.name); });
        this.sortArt(this.art);
        this.allEventsOld = false;
        this.initGeoLocation();

        let campIndex: any = {};
        let locIndex: any = {};
        let pinIndex: any = {};
        let artIndex: any = {};
        let artGPS: any = {};
        let artLocationNames: any = {};
        for (let camp of this.camps) {
            const pin = this.locateCamp(camp);

            if (pin) {
                const gpsCoords = mapToGps({ x: pin.x, y: pin.y });
                camp.gpsCoord = gpsCoords;
                camp.pin = pin;
            }
            campIndex[camp.uid] = camp.name;
            locIndex[camp.uid] = camp.location_string;
            pinIndex[camp.uid] = camp.pin;
            if (camp.imageUrl) {
                camp.imageUrl = `https://data.dust.events/${camp.imageUrl}`;
            }
            if (hideLocations) {
                camp.location_string = LocationName.Unavailable;
            } else if (!camp.location_string) {
                camp.location_string = LocationName.Undefined;
            }
        }
        for (let art of this.art) {
            artIndex[art.uid] = art.name;
            artLocationNames[art.uid] = art.location_string;
            const pin = locationStringToPin(art.location_string!, this.mapRadius);
            if (pin) {
                const gpsCoords = mapToGps({ x: pin.x, y: pin.y });
                art.gpsCoords = gpsCoords;
                artGPS[art.uid] = art.gpsCoords;
            }
            if (!art.location_string) {
                art.location_string = LocationName.Unplaced;
            }
            if (hideLocations) {
                art.location_string = LocationName.Unavailable;
            }
        }
        this.days = [];
        this.categories = [];
        this.allEventsOld = !this.checkEvents();
        for (let event of this.events) {
            let allLong = true;
            if (!this.categories.includes(event.event_type.label)) {
                this.categories.push(event.event_type.label);
            }
            if (event.imageUrl) {
                event.imageUrl = `https://data.dust.events/${event.imageUrl}`;
            }
            if (event.hosted_by_camp) {
                event.camp = campIndex[event.hosted_by_camp];
                event.location = locIndex[event.hosted_by_camp];

                const pin = locationStringToPin(event.location, this.mapRadius);
                const placed = pinIndex[event.hosted_by_camp];
                if (placed) {
                    event.pin = placed;
                }
                if (pin) {
                    const gpsCoords = mapToGps({ x: pin.x, y: pin.y });
                    event.gpsCoords = gpsCoords;
                } else {
                    if (!environment.production) {
                        console.error(`Unable to find camp ${event.hosted_by_camp} for event ${event.title}`);
                    }
                }
                if (hideLocations) {
                    event.location = LocationName.Unavailable;
                }
            } else if (event.other_location) {
                event.camp = event.other_location;
                if (event.camp.toLowerCase().includes('center camp')) {
                    event.location = '6:00 & A';
                    const pin = locationStringToPin(event.location, this.mapRadius);
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
                } catch (err) {
                    console.error(`Failed GPS: ${event.title} hosted at art ${event.located_at_art}`);
                }
            } else {
                console.error('no location', event);
            }
            if (event.print_description === '') {
                // Happens before events go to the WWW guide
                event.print_description = event.description;
            }

            // Events over 6 hours are no worth it
            // event.occurrence_set = event.occurrence_set.filter(o => {
            //     let start: Date = new Date(o.start_time);
            //     let end: Date = new Date(o.end_time);
            //     const hrs = this.hoursBetween(start, end);
            //     return hrs <= 6;
            // });

            for (let occurrence of event.occurrence_set) {
                let start: Date = new Date(occurrence.start_time);
                let end: Date = new Date(occurrence.end_time);
                this.addDay(start);
                const hrs = this.hoursBetween(start, end);
                if (hrs > 24) {
                    occurrence.end_time = new Date(start.getFullYear(), start.getMonth(), start.getDate(), end.getHours(), end.getMinutes()).toLocaleString('en-US', { timeZone: BurningManTimeZone })
                    end = new Date(occurrence.end_time);
                }
                if (hrs <= 6) {
                    allLong = false;
                }

                // Change midnight to 11:49 so that it works with the sameday function
                if (occurrence.end_time.endsWith('T00:00:00-07:00')) {
                    const t = occurrence.start_time.split('T');
                    occurrence.end_time = t[0] + 'T23:59:00-07:00';
                    end = new Date(occurrence.end_time);
                }
                const res = this.getOccurrenceTimeStringCached(start, end, undefined);
                occurrence.longTimeString = res ? res.long : 'Unknown';
            }
            const timeString = this.getTimeString(event, undefined);
            event.timeString = timeString.short;
            event.longTimeString = timeString.long;
            event.all_day = allLong;
        }
        this.categories.sort();
        this.cache = {};
        console.timeEnd('init');
    }

    private locateCamp(camp: Camp): Pin | undefined {
        if (!camp.location_string) return undefined;
        return locationStringToPin(camp.location_string, this.mapRadius);
    }

    public async setDataset(ds: FullDataset): Promise<DatasetResult | undefined> {
        let result: DatasetResult | undefined;
        try {
            this.dataset = ds.dataset;
            this.events = await this.loadData(ds.events);
            this.camps = await this.loadData(ds.camps);
            this.art = await this.loadData(ds.art);
            this.links = await this.loadData(ds.links);
            this.pins = await this.loadData(ds.pins);
            const rslData = await this.loadData(ds.rsl);
            console.log(`Setting dataset in worker: ${this.events.length} events, ${this.camps.length} camps, ${this.art.length} art`);
            result = {
                events: this.events.length,
                camps: this.camps.length,
                art: this.art.length,
                pins: this.pins.length,
                links: this.links.length,
                rsl: 0
            }
        } catch (err) {
            console.error(`Failed to setDataset`, err);
            throw new Error(`setDataset: ${err}`);
        } finally {
            this.init(ds.hideLocations);
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

    public async getRSLEventList(ids: string[]): Promise<RSLEvent[]> {
        if (ids.length == 0) return [];
        return await this.getRSLEvents('', undefined, undefined, ids, undefined);
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
        return (s == undefined || s == '');
    }

    public async searchRSLEvents(query: string): Promise<Day[]> {

        function unique(value: string, index: number, data: string[]) {
            return data.indexOf(value) === index;
        }

        const events = await this.getRSLEvents(query, undefined, undefined, [], undefined);
        const found = events.map(e => e.day).filter(unique);
        const days = this.getDays();
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
        const offset = day.getTimezoneOffset()
        day = new Date(day.getTime() - (offset * 60 * 1000))
        return day.toISOString().split('T')[0]
    }

    public async getRSLEvents(query: string, day: Date | undefined, coords: GpsCoord | undefined, ids?: string[] | undefined, campId?: string | undefined): Promise<RSLEvent[]> {
        try {
            const res = await fetch(this.path('rsl', true));
            const events: RSLEvent[] = await res.json();
            const result: RSLEvent[] = [];
            query = this.scrubQuery(query);
            const fDay = day ? this.toRSLDateFormat(day) : undefined;
            const today = now();
            console.log('getRSLEvents');
            const campPins: any = {};
            for (let event of events) {
                // Place RSL Events at the camp pin
                if (event.campUID) {
                    const pin = campPins[event.campUID];
                    if (pin) {
                        event.pin = pin;
                    } else {
                        const camps = this.getCampList([event.campUID]);                        
                        if (!event.pin) {
                            event.pin = camps[0].pin;
                            Object.defineProperty(campPins, event.campUID, { value: event.pin, enumerable: true });
                        }
                    }
                }                

                let match = false;
                if (campId) {
                    match = (event.campUID == campId && this.nullOrEmpty(event.artCar));
                } else {
                    match = (this.rslEventContains(event, query) && (event.day == fDay || !!ids));
                }

                if (match) {
                    let allOld = true;
                    for (let occurrence of event.occurrences) {
                        occurrence.old = (new Date(occurrence.endTime).getTime() - today.getTime() < 0);
                        if (!occurrence.old) {
                            allOld = false;
                        }
                    }
                    if (ids && ids.length > 0) {
                        event.occurrences = event.occurrences.filter(o => {
                            const id = `${event.id}-${o.id}`;
                            return ids.includes(id);
                        });
                        if (event.occurrences.length == 0) {
                            allOld = true; // Don't include
                        }
                    }
                    if (!allOld) {
                        // If all times have ended
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
            console.error(`getRSLEvents returned an error`, err)
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
        events.sort((a: RSLEvent, b: RSLEvent) => { return new Date(a.day).getTime() - new Date(b.day).getTime(); });
    }
    private sortRSLEventsByName(events: RSLEvent[]) {
        events.sort((a: RSLEvent, b: RSLEvent) => { return a.camp.localeCompare(b.camp); });
    }
    private sortRSLEventsByDistance(events: RSLEvent[]) {
        events.sort((a: RSLEvent, b: RSLEvent) => { return a.distance - b.distance; });
    }

    private rslEventContains(event: RSLEvent, query: string): boolean {
        if (query == '') return true;
        if (event.camp.toLowerCase().includes(query)) return true;
        if (event.artCar && event.artCar.toLowerCase().includes(query)) return true;
        if (event.title && event.title.toLowerCase().includes(query)) return true;
        if (event.location.toLowerCase().includes(query)) return true;
        for (let occurrence of event.occurrences) {
            if (occurrence.who.toLowerCase().includes(query)) {
                event.occurrences = event.occurrences.filter(o => o.who.toLowerCase().includes(query));
                return true;
            }
            if (occurrence.timeRange.toLowerCase().includes(query)) {
                event.occurrences = event.occurrences.filter(o => o.timeRange.toLowerCase().includes(query));
                return true;
            }
        }
        return false;
    }

    public findEvents(query: string, day: Date | undefined, category: string, coords: GpsCoord | undefined, timeRange: TimeRange | undefined, allDay: boolean): Event[] {
        const result: Event[] = [];
        if (query) {
            query = this.scrubQuery(query);
        }
        for (let event of this.events) {
            if (this.eventContains(query, event, allDay) && this.eventIsCategory(category, event) && this.onDay(day, event, timeRange)) {
                const timeString = this.getTimeString(event, day);
                event.timeString = timeString.short;
                event.longTimeString = timeString.long;
                event.distance = distance(coords!, event.gpsCoords);
                event.distanceInfo = formatDistance(event.distance);
                result.push(event);
            }
        }
        if (coords) {
            this.sortEventsByDistance(result);
        } else {
            this.sortEvents(result);
        }
        return result;
    }

    private sortEvents(events: Event[]) {
        events.sort((a: Event, b: Event) => { return a.start.getTime() - b.start.getTime() });
    }

    private sortEventsByDistance(events: Event[]) {
        events.sort((a: Event, b: Event) => {
            return (a.happening ? 0 : 1) - (b.happening ? 0 : 1) || a.distance - b.distance;
        });
    }

    private sortCamps(camps: Camp[]) {
        camps.sort((a: Camp, b: Camp) => { return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) });
    }

    private sortCampsByDistance(camps: Camp[]) {
        camps.sort((a: Camp, b: Camp) => { return a.distance - b.distance });
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

    public findCamps(query: string, coords?: GpsCoord): Camp[] {
        const result: Camp[] = [];
        if (query) {
            query = this.scrubQuery(query);
        }
        for (let camp of this.camps) {

            if (coords) {
                camp.distance = distance(coords, camp.gpsCoord);
                camp.distanceInfo = formatDistance(camp.distance);
            } else {
                camp.distanceInfo = '';
            }
            if (this.campMatches(query, camp)) {
                result.push(camp);
            }
        }
        if (coords) {
            this.sortCampsByDistance(result);
        } else {
            this.sortCamps(result);
        }
        return result;
    }

    private campMatches(query: string, camp: Camp): boolean {
        return camp.name.toLowerCase().includes(query) || camp.location_string?.toLowerCase().includes(query)
            || camp.description?.toLowerCase().includes(query) || false;

    }



    public findArts(query: string | undefined, coords: GpsCoord | undefined): Art[] {
        const result: Art[] = [];
        if (query) {
            query = this.scrubQuery(query);
        }
        for (let art of this.art) {
            if (coords) {
                art.distance = distance(coords, art.gpsCoords);
                art.distanceInfo = formatDistance(art.distance);
            }
            if (!query || art.name.toLowerCase().includes(query.toLowerCase())) {
                result.push(art);
            }
        }
        if (coords) {
            this.sortArtByDistance(result);
        } else {
            this.sortArt(result);
        }
        return result;
    }

    private eventIsCategory(category: string, event: Event): boolean {
        if (category === '') return true;
        return event.event_type?.label === category;
    }

    private getTimeString(event: Event, day: Date | undefined): TimeString {
        for (let occurrence of event.occurrence_set) {
            const start: Date = new Date(occurrence.start_time);
            const end: Date = new Date(occurrence.end_time);
            event.start = start;
            const res = this.getOccurrenceTimeStringCached(start, end, day);
            if (res) {
                return res;
            }
        }
        return { short: 'Dont know', long: 'Dont know' };
    }

    private getOccurrenceTimeStringCached(start: Date, end: Date, day: Date | undefined): TimeString | undefined {
        const key = `${start.getTime()}-${end.getTime()}-${day}`;
        if (!(key in this.cache)) {
            this.cache[key] = getOccurrenceTimeString(start, end, day);
        }
        return this.cache[key];
    }

    private hoursBetween(d1: any, d2: any): number {
        return Math.abs(d1 - d2) / 36e5;
    }

    public getDays(): Day[] {
        const result: Day[] = [];
        for (let day of this.days) {
            const date = new Date(day);
            result.push({ name: getDayNameFromDate(date).substring(0, 3), dayName: date.getDate().toString(), date });
        }
        result.sort((a, b) => { return a.date.getTime() - b.date.getTime(); });
        return result;
    }

    private eventContains(terms: string, event: Event, allDay: boolean): boolean {
        if (!allDay) {
            if (event.all_day) return false;
        }
        return (terms == '') ||
            (event.title.toLowerCase().includes(terms) ||
                event.camp?.toLowerCase().includes(terms) ||
                event.location?.toLowerCase().includes(terms) ||
                event.description.toLowerCase().includes(terms));
    }

    private onDay(day: Date | undefined, event: Event, timeRange: TimeRange | undefined): boolean {
        if (!day && !timeRange) return true;
        for (let occurrence of event.occurrence_set) {
            const start = new Date(occurrence.start_time);
            const end = new Date(occurrence.end_time);

            if (day) {
                if (!occurrence.old && ((sameDay(start, day) || sameDay(end, day)))) {
                    return true;
                }
            } else if (timeRange) {
                if (start > timeRange.start && start < timeRange.end) {
                    return true;
                }
            }
        }
        return false;
    }

    private addDay(date: Date) {
        const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
        if (!this.days.includes(day)) {
            this.days.push(day);
        }
    }

    private path(name: string, online?: boolean): string {
        if (this.dataset !== CurrentYear && online) {
            if (this.dataset.toLowerCase().includes('ttitd')) {
                // Burning Man dataset is extracted from API and published manually
                return `https://dust.events/assets/data-v2/${this.dataset}/${name}.json`;
            } else {
                return `https://data.dust.events/${this.dataset}/${name}.json?${Math.random()}`;
            }
        }
        return `assets/${this.dataset}/${name}.json`;
    }

    private async loadEvents(): Promise<Event[]> {
        const res = await fetch(this.path('events', true));
        return await res.json();
    }

    private async loadData(uri: string): Promise<any> {
        console.log(`Worker fetch ${uri}...`);
        try {
            const res = await fetch(uri);
            return await res.json();
        } catch (err) {
            //throw new Error(`${uri}: ${err}`)
            console.error(`Worker fetch Failed to load ${uri}`);
            return [];
        }
    }

    public async getPotties(): Promise<Pin[]> {
        const res = await fetch(this.path('potties'));
        return await res.json();
    }

    public async getGPSPoints(name: string, title: string): Promise<MapSet> {
        try {
            const res = await fetch(this.path(name));
            const data: GPSSet = await res.json();
            const result: MapSet = { title: data.title, description: data.description, points: [] };
            for (let gps of data.points) {
                const point = gpsToMap(gps);
                const mapPoint: MapPoint = { street: '', clock: '', x: point.x, y: point.y, gps: structuredClone(gps), info: { title, location: '', subtitle: '' } }
                result.points.push(mapPoint);
            }
            return result;
        } catch (err) {
            return { title: '', description: '', points: [] }
        }
    }

    public async getMapPoints(name: string): Promise<MapSet> {
        try {
            const res = await fetch(this.path(name));
            const mapSet: MapSet = await res.json();
            for (let point of mapSet.points) {
                point.gps = this.getMapPointGPS(point);
            }
            return mapSet;
        } catch (err) {
            return { title: '', description: '', points: [] };
        }
    }

    public async getPins(pinType: string): Promise<MapSet> {
        try {
            const url = this.path('pins', true);
            console.log(`Get ${url}`);
            const res = await fetch(url);
            const pins: PlacedPin[] = await res.json();
            const mapSet: MapSet = { title: pinType, description: '', points: [] };
            for (let pin of pins) {
                const mp: MapPoint = { x: pin.x, y: pin.y, street: '', clock: '' };
                mp.gps = this.getMapPointGPS(mp);
                if (pin.label == pinType) {
                    mapSet.points.push(mp);
                }
            }
            return mapSet;
        } catch (err) {
            return { title: pinType, description: '', points: [] };
        }
    }

    public async getGeoReferences(): Promise<GeoRef[]> {
        try {
            const res = await fetch(this.path('geo', true));

            return await res.json();
        } catch {
            return [];
        }
    }

    private async loadCamps(): Promise<Camp[]> {
        const res = await fetch(this.path('camps', true));
        return await res.json();
    }

    private async loadArt(): Promise<Art[]> {
        const res = await fetch(this.path('art', true));
        return await res.json();
    }

    private async loadPins(): Promise<PlacedPin[]> {
        try {
            const res = await fetch(this.path('pins', true));
            return await res.json();
        } catch {
            return [];
        }
    }

    private async loadLinks(): Promise<Link[]> {
        try {
            const res = await fetch(this.path('links', true));
            return await res.json();
        } catch {
            return [];
        }
    }

    private async loadRevision(): Promise<Revision> {
        const res = await fetch(this.path('revision', true));
        return await res.json();
    }
}