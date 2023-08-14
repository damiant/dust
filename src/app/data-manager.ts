import { WorkerClass } from './worker-interface';
import { Art, Camp, DataMethods, Day, Event, GeoRef, LocationName, MapPoint, MapSet, Pin, Revision, TimeString } from './models';
import { BurningManTimeZone, getDayNameFromDate, getOccurrenceTimeString, now, sameDay } from './utils';
import { distance, getPoint, locationStringToPin, toClock, toMapPoint, toRadius, toStreetRadius } from './map/map.utils';
import { GpsCoord, Point, gpsToMap, mapToGps, setReferencePoints } from './map/geo.utils';

interface TimeCache {
    [index: string]: TimeString | undefined;
}

export class DataManager implements WorkerClass {
    private events: Event[] = [];
    private camps: Camp[] = [];
    private categories: string[] = [];
    private art: Art[] = [];
    private days: number[] = [];
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
            case DataMethods.SetDataset: return this.setDataset(args[0], args[1], args[2], args[3], args[4]);
            case DataMethods.GetEvents: return this.getEvents(args[0], args[1]);
            case DataMethods.GetEventList: return this.getEventList(args[0]);
            case DataMethods.GetCampList: return this.getCampList(args[0]);
            case DataMethods.GetArtList: return this.getArtList(args[0]);
            case DataMethods.FindArts: return this.findArts(args[0]);
            case DataMethods.FindArt: return this.findArt(args[0]);
            case DataMethods.GpsToPoint: return this.gpsToPoint(args[0]);
            case DataMethods.GetMapPoints: return this.getMapPoints(args[0]);
            case DataMethods.CheckEvents: return this.checkEvents(args[0]);
            case DataMethods.FindEvents: return this.findEvents(args[0], args[1], args[2], args[3]);
            case DataMethods.FindCamps: return this.findCamps(args[0], args[1]);
            case DataMethods.FindEvent: return this.findEvent(args[0]);
            case DataMethods.FindCamp: return this.findCamp(args[0]);
            case DataMethods.GetGeoReferences: return this.getGeoReferences();
            case DataMethods.GetCampEvents: return this.getCampEvents(args[0]);
            case DataMethods.GetCamps: return this.getCamps(args[0], args[1]);
            default: console.error(`Unknown method ${method}`);
        }
    }

    public async populate(dataset: string, hideLocations: boolean): Promise<number> {
        this.dataset = dataset;
        this.events = await this.loadEvents();
        this.camps = await this.loadCamps();
        this.art = await this.loadArt();
        this.revision = await this.loadRevision();
        this.georeferences = await this.getGeoReferences();
        console.log(`Revsion populated ${this.revision.revision} hide locations = ${hideLocations}`);
        this.init(hideLocations);
        return this.revision.revision;
    }

    private sortArt(art: Art[]) {
        art.sort((a: Art, b: Art) => { return a.name.localeCompare(b.name); });
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
        for (let ref of [this.georeferences[0], this.georeferences[1], this.georeferences[2]]) {
            gpsCoords.push({ lat: ref.coordinates[0], lng: ref.coordinates[1] });
            const mp: MapPoint = { clock: ref.clock, street: ref.street };
            const pt = this.mapPointToPoint(mp, this.mapRadius);
            points.push(pt);
        }

        setReferencePoints(gpsCoords, points);
    }

    private mapPointToPoint(mapPoint: MapPoint, circleRadius: number) {
        const clock = toClock(mapPoint.clock);
        const rad = toStreetRadius(mapPoint.street);
        const circleRad = circleRadius;
        return getPoint(clock, rad, circleRad);
    }

    private gpsToPoint(gpsCoord: GpsCoord): Point {
        return gpsToMap(gpsCoord);
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
        let artIndex: any = {};
        for (let camp of this.camps) {

            const pin = this.locateCamp(camp);

            if (pin) {
                const gpsCoords = mapToGps({ x: pin.x, y: pin.y });
                //console.log(`${camp.name} x=${pin.x} y=${pin.y} lat=${gpsCoords.lat} lng=${gpsCoords.lng}`)
                camp.gpsCoord = gpsCoords;
                camp.pin = pin;
            }
            campIndex[camp.uid] = camp.name;
            locIndex[camp.uid] = camp.location_string;
            if (!camp.location_string || hideLocations) {
                camp.location_string = LocationName.Unavailable;
            }
        }
        for (let art of this.art) {
            artIndex[art.uid] = art.name;
            if (!art.location_string || hideLocations) {
                art.location_string = LocationName.Unavailable;
            }
        }
        this.days = [];
        this.categories = [];
        this.allEventsOld = !this.checkEvents();
        for (let event of this.events) {
            if (!this.categories.includes(event.event_type.label)) {
                this.categories.push(event.event_type.label);
            }
            if (event.hosted_by_camp) {
                event.camp = campIndex[event.hosted_by_camp];
                event.location = locIndex[event.hosted_by_camp];
                
                const pin = locationStringToPin(event.location, this.mapRadius);
                if (pin) {
                    const gpsCoords = mapToGps({ x: pin.x, y: pin.y });
                    event.gpsCoords = gpsCoords;
                }
                if (hideLocations) {
                    event.location = LocationName.Unavailable;
                }
            } else if (event.other_location) {
                event.camp = event.other_location;
            } else if (event.located_at_art) {
                event.camp = artIndex[event.located_at_art];
            } else {
                console.log('no location', event);
            }
            if (event.print_description === '') {
                // Happens before events go to the WWW guide
                event.print_description = event.description;
            }

            for (let occurrence of event.occurrence_set) {

                let start: Date = new Date(occurrence.start_time);
                let end: Date = new Date(occurrence.end_time);
                this.addDay(start);
                const hrs = this.hoursBetween(start, end);
                if (hrs > 24) {
                    //const old = occurrence.end_time;
                    occurrence.end_time = new Date(start.getFullYear(), start.getMonth(), start.getDate(), end.getHours(), end.getMinutes()).toLocaleString('en-US', { timeZone: BurningManTimeZone })
                    //const newHrs = this.hoursBetween(new Date(occurrence.start_time), new Date(occurrence.end_time));
                    end = new Date(occurrence.end_time);
                    //console.log(`Fixed end time of ${event.title} from ${old}=>${occurrence.end_time} (starting ${occurrence.start_time}) because event was ${hrs} hours long. Now ${newHrs} hours long.`);
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
        }
        this.categories.sort();
        this.cache = {};
        console.timeEnd('init');
    }

    private locateCamp(camp: Camp): Pin | undefined {
        if (!camp.location_string) return undefined;
        return locationStringToPin(camp.location_string, this.mapRadius);
    }

    // private plot(clock: number, rad: number, offset: any, radius: number) {
    //     const pt = getPoint(clock, rad, radius);
    //     if (offset) {
    //         pt.x += offset.x;
    //         pt.y += offset.y;
    //     }
    //     return pt;
    // }

    public setDataset(dataset: string, events: Event[], camps: Camp[], art: Art[], hideLocations: boolean) {
        this.dataset = dataset;
        this.events = events;
        this.camps = camps;
        this.art = art;
        this.init(hideLocations);
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

    public findEvents(query: string, day: Date | undefined, category: string, coords: GpsCoord | undefined): Event[] {
        const result: Event[] = [];
        for (let event of this.events) {
            if (this.eventContains(query, event) && this.eventIsCategory(category, event) && this.onDay(day, event)) {
                const timeString = this.getTimeString(event, day);
                event.timeString = timeString.short;
                event.longTimeString = timeString.long;
                event.distance = distance(coords!, event.gpsCoords);
                event.distanceInfo = this.formatDistance(event.distance);
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
        const qry = query.toLowerCase();
        for (let camp of this.camps) {

            if (coords) {
                camp.distance = distance(coords, camp.gpsCoord);
                camp.distanceInfo = this.formatDistance(camp.distance);


                //console.log(`${camp.name} ${camp.distance}`);
            } else {
                camp.distanceInfo = '';
            }
            if (camp.name.toLowerCase().includes(qry) || camp.location_string?.toLowerCase().includes(qry)) {
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

    private formatDistance(dist: number): string {
        if (dist == 999) {
            return '';
        }
        const rounded = Math.round(dist * 10) / 10
        if (rounded == 0.0) {
            return '(near)';
        } else if (rounded > 100) {
            return '(far)'
        }
        return `(${rounded}mi)`;
    }

    public findArts(query: string | undefined): Art[] {
        if (!query) {
            return this.art;
        }
        const result: Art[] = [];
        for (let art of this.art) {
            if (!query || art.name.toLowerCase().includes(query.toLowerCase())) {
                result.push(art);
            }
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

    private eventContains(terms: string, event: Event): boolean {
        return (terms == '') ||
            (event.title.toLowerCase().includes(terms) ||
                event.description.toLowerCase().includes(terms));
    }

    private onDay(day: Date | undefined, event: Event): boolean {
        if (!day) return true;
        for (let occurrence of event.occurrence_set) {
            const start = new Date(occurrence.start_time);
            const end = new Date(occurrence.end_time);

            if (!occurrence.old && ((sameDay(start, day) || sameDay(end, day)))) {
                return true;
            }
        }
        return false;
    }

    private addDay(date: Date) {
        const name = date.toLocaleDateString();
        const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
        if (!this.days.includes(day)) {
            this.days.push(day);
        }
    }

    private path(name: string): string {
        return `assets/${this.dataset}/${name}.json`;
    }
    private async loadEvents(): Promise<Event[]> {
        const res = await fetch(this.path('events'));
        return await res.json();
    }

    public async getPotties(): Promise<Pin[]> {
        const res = await fetch(this.path('potties'));
        return await res.json();
    }

    public async getMapPoints(name: string): Promise<MapSet> {
        const res = await fetch(this.path(name));
        return await res.json();
    }

    public async getGeoReferences(): Promise<GeoRef[]> {
        const res = await fetch(this.path('geo'));
        return await res.json();
    }

    private async loadCamps(): Promise<Camp[]> {
        const res = await fetch(this.path('camps'));
        return await res.json();
    }

    private async loadArt(): Promise<Art[]> {
        const res = await fetch(this.path('art'));
        return await res.json();
    }

    private async loadRevision(): Promise<Revision> {
        const res = await fetch(this.path('revision'));
        return await res.json();
    }
}

function notNull(v: string | undefined): string {
    return (!v) ? '' : v;
}