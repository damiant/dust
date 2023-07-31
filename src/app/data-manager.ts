import { WorkerClass } from './worker-interface';
import { Art, Camp, Day, Event, LocationName } from './models';
import { now, sameDay } from './utils';

interface TimeOptions {
    long?: boolean;
}

export class DataManager implements WorkerClass {
    private events: Event[] = [];
    private camps: Camp[] = [];
    private art: Art[] = [];
    private days: string[] = [];
    private allEventsOld = false;
    private dataset: string = '';

    // This is required for a WorkerClass
    public async doWork(method: string, args: any[]): Promise<any> {
        switch (method) {
            case 'populate': return await this.populate(args[0]);
            case 'getDays': return this.getDays();
            case 'setDataset': return this.setDataset(args[0], args[1], args[2], args[3]);
            case 'getEvents': return this.getEvents(args[0], args[1]);
            case 'getEventList': return this.getEventList(args[0]);
            case 'getCampList': return this.getCampList(args[0]);
            case 'getArtList': return this.getArtList(args[0]);
            case 'findArts': return this.findArts(args[0]);
            case 'findArt': return this.findArt(args[0]);
            case 'checkEvents': return this.checkEvents();
            case 'findEvents': return this.findEvents(args[0], args[1]);
            case 'findCamps': return this.findCamps(args[0]);
            case 'findEvent': return this.findEvent(args[0]);
            case 'findCamp': return this.findCamp(args[0]);
            case 'getCampEvents': return this.getCampEvents(args[0]);
            case 'getCamps': return this.getCamps(args[0], args[1]);
            default: console.error(`Unknown method ${method}`);
        }
    }

    public async populate(dataset: string): Promise<number> {
        this.dataset = dataset;
        this.events = await this.loadEvents();
        this.camps = await this.loadCamps();
        this.art = await this.loadArt();

        this.init();
        return this.events.length + this.camps.length;
    }

    private sortArt(art: Art[]) {
        art.sort((a: Art, b: Art) => { return a.name.localeCompare(b.name); });
    }

    private checkEvents(): boolean {
        const today = now();
        let hasLiveEvents = false;
        for (const event of this.events) {
            event.old = true;
            try {
                for (let occurrence of event.occurrence_set) {
                    // This makes all events happen today
                    // let start: Date = new Date(occurrence.start_time);
                    // let end: Date = new Date(occurrence.end_time);
                    // occurrence.start_time = this.setToday(start).toString();
                    // occurrence.end_time = this.setToday(end).toString();

                    if (this.allEventsOld) {
                        event.old = false;
                        occurrence.old = false;
                        hasLiveEvents = true;
                    } else {
                        occurrence.old = (new Date(occurrence.end_time).getTime() - today.getTime() < 0);
                        if (!occurrence.old) {
                            event.old = false;
                            hasLiveEvents = true;
                        }
                    }

                }
            } catch (err) {
                console.error('Failed', event);
                throw err;
            }
        }
        console.log(`Event has live events: ${hasLiveEvents}`);
        return hasLiveEvents;
    }

    private init() {
        this.camps = this.camps.filter((camp) => { return camp.description || camp.location_string });
        for (const camp of this.camps) {
            if (typeof camp.name == 'number') {
                console.error(`Invalid camp`, camp);
            }
        }
        this.camps.sort((a: Camp, b: Camp) => { return a.name.localeCompare(b.name); });
        this.sortArt(this.art);
        this.allEventsOld = false;

        let campIndex: any = {};
        let locIndex: any = {};
        let artIndex: any = {};
        for (let camp of this.camps) {
            if (!camp.location_string) {
                camp.location_string = LocationName.Unavailable;
            }
            campIndex[camp.uid] = camp.name;
            locIndex[camp.uid] = camp.location_string;//notNull(camp.location.intersection) + camp.location.frontage!;
        }
        for (let art of this.art) {
            artIndex[art.uid] = art.name;
            if (!art.location_string) {
                art.location_string = LocationName.Unavailable;
            }
        }
        this.days = [];
        this.allEventsOld = !this.checkEvents();
        for (let event of this.events) {
            if (event.hosted_by_camp) {
                event.camp = campIndex[event.hosted_by_camp];
                event.location = locIndex[event.hosted_by_camp];
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
            if (!event.print_description.endsWith('.')) {
                event.print_description = event.print_description + '.';
            }
            for (let occurrence of event.occurrence_set) {

                let start: Date = new Date(occurrence.start_time);
                let end: Date = new Date(occurrence.end_time);

                this.addDay(start);
                const hrs = this.hoursBetween(start, end);
                if (hrs > 24) {
                    const old = occurrence.end_time;
                    occurrence.end_time = new Date(start.getFullYear(), start.getMonth(), start.getDate(), end.getHours(), end.getMinutes()).toISOString();
                    const newHrs = this.hoursBetween(new Date(occurrence.start_time), new Date(occurrence.end_time));
                    end = new Date(occurrence.end_time);
                    //console.log(`Fixed end time of ${event.name} from ${old}=>${occurrence.end_time} (starting ${occurrence.start_time}) because event was ${hrs} hours long. Now ${newHrs} hours long.`);
                }
                if (end.getHours() == 0 && end.getMinutes() == 0) {
                    // Midnight is set to 11:59
                    const prev = end;

                    occurrence.end_time = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 23, 59).toISOString();
                    end = new Date(occurrence.end_time);
                    //console.log(`Fixed midnight ${event.name} ${prev}=>${end}`);
                }
            }
            event.timeString = this.getTimeString(event, undefined);
            event.longTimeString = this.getTimeString(event, undefined, { long: true });
        }
    }

    private setToday(d: Date): Date {
        const today = now();
        d.setDate(today.getDate());
        d.setMonth(today.getMonth());
        d.setFullYear(today.getFullYear());
        return d;
    }

    public setDataset(dataset: string, events: Event[], camps: Camp[], art: Art[]) {
        this.dataset = dataset;
        this.events = events;
        this.camps = camps;
        this.art = art;
        this.init();
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
                for (let image of art.images) {
                    image.ready = false;
                }
                return art;
            }
        }
        return undefined;
    }

    public findEvents(query: string, day: Date | undefined): Event[] {
        const result: Event[] = [];
        for (let event of this.events) {
            if (this.eventContains(query, event) && this.onDay(day, event)) {
                event.timeString = this.getTimeString(event, day);
                event.longTimeString = this.getTimeString(event, day, { long: true });
                result.push(event);
            }
        }
        this.sortEvents(result);
        return result;
    }

    private sortEvents(events: Event[]) {
        events.sort((a: Event, b: Event) => { return a.start.getTime() - b.start.getTime() });
    }

    private sortCamps(camps: Camp[]) {
        camps.sort((a: Camp, b: Camp) => { return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) });
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

    public findCamps(query: string): Camp[] {
        const result: Camp[] = [];
        const qry = query.toLowerCase();
        for (let camp of this.camps) {
            if (camp.name.toLowerCase().includes(qry) || camp.location_string?.toLowerCase().includes(qry)) {
                result.push(camp);
            }
        }
        this.sortCamps(result);
        return result;
    }

    public findArts(query: string | undefined): Art[] {
        const result: Art[] = [];
        for (let art of this.art) {
            if (!query || art.name.toLowerCase().includes(query.toLowerCase())) {
                result.push(art);
            }
        }
        return result;
    }



    private getTimeString(event: Event, day: Date | undefined, options?: TimeOptions): string {
        for (let occurrence of event.occurrence_set) {
            const start: Date = new Date(occurrence.start_time);
            const end: Date = new Date(occurrence.end_time);
            const startsToday = day && sameDay(start, day);
            const endsToday = day && sameDay(end, day);
            if (!day || startsToday || endsToday) {
                event.start = start;
                if (options?.long) {
                    const day = start.toLocaleDateString([], { weekday: 'long' });
                    return `${day} ${this.time(start)}-${this.time(end)} (${this.timeBetween(end, start)})`;
                } else {
                    if (endsToday && !startsToday) {
                        return `Until ${this.time(end)} (${this.timeBetween(end, start)})`;
                    } else {
                        return `${this.time(start)} (${this.timeBetween(end, start)})`;
                    }
                }
            }
        }
        return 'dont know';
    }

    private timeBetween(d1: any, d2: any): string {
        const hrs = Math.ceil(Math.abs(d1 - d2) / 36e5);
        const mins = Math.floor((Math.abs(d1 - d2) / 1000) / 60);
        return (mins < 60) ? `${mins}mins` : `${hrs}hrs`;
    }

    private hoursBetween(d1: any, d2: any): number {
        return Math.abs(d1 - d2) / 36e5;
    }

    private time(d: Date): string {
        if (d.getMinutes() != 0) {
            return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase().replace(' ', '');
        }
        let hrs = d.getHours();
        const ampm = hrs >= 12 ? 'pm' : 'am';
        hrs = hrs % 12;
        if (hrs == 0) {
            return (ampm == 'pm') ? 'Noon' : 'Midnight';
        }
        return `${hrs}${ampm}`;
    }

    public getDays(): Day[] {
        const result: Day[] = [];
        for (let day of this.days) {
            const date = new Date(day);
            result.push({ name: this.getDayName(day).substring(0, 3), dayName: date.getDate().toString(), date });
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
            if (!occurrence.old && (sameDay(start, day) || sameDay(end, day))) {
                return true;
            }
        }
        return false;
    }

    private addDay(date: Date) {
        const name = date.toLocaleDateString();
        if (!this.days.includes(name)) {
            this.days.push(name);
        }
    }

    private getDayName(dateStr: string) {
        var date = new Date(dateStr);
        return date.toLocaleDateString([], { weekday: 'long' });
    }

    private path(name: string): string {
        return `assets/${this.dataset}/${name}.json`;
    }
    private async loadEvents(): Promise<Event[]> {
        const res = await fetch(this.path('events'));
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
}

function notNull(v: string | undefined): string {
    return (!v) ? '' : v;
}