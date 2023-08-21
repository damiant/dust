import { RSLEvent, RSLOccurrence } from "src/app/data/models";
import { RSLImportCamp, RSLImportSchedule } from "./rsl-models";
import { existsSync, readFileSync } from "fs";
import { downloadImageAndConvertToWebP } from "./image-utils";
import { join } from "path";

// From Sat 9_2_2023-Table 1.tsv to 2023-09-02
export function toDay(filename: string): string {
    const t = filename.split(' ');
    const d = t[1]; // 9_2_2023
    const ds = d.split('_');
    const day = ds[1].padStart(2, '0');
    const month = ds[0].padStart(2, '0');
    const year = ds[2].replace('-Table', '');
    return `${year}-${month}-${day}`;
}

export function hashCode(s: string): number {
    var hash = 0,
        i, chr;
    if (s.length === 0) return hash;
    for (i = 0; i < s.length; i++) {
        chr = s.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

export function toIsoString(date: Date) {
    var tzo = -date.getTimezoneOffset(),
        dif = tzo >= 0 ? '+' : '-',
        pad = function (num: number) {
            return (num < 10 ? '0' : '') + num;
        };

    return date.getFullYear() +
        '-' + pad(date.getMonth() + 1) +
        '-' + pad(date.getDate()) +
        'T' + pad(date.getHours()) +
        ':' + pad(date.getMinutes()) +
        ':' + pad(date.getSeconds()) +
        dif + pad(Math.floor(Math.abs(tzo) / 60)) +
        ':' + pad(Math.abs(tzo) % 60);
}

function findCamp(name: string, camps: RSLImportCamp[]): RSLImportCamp | undefined {
    for (let camp of camps) {
        if (camp.campname == name) {
            return camp;
        }
    }
    return undefined;
}

let rslId = 0;

function findRSLEvent(rslEvents: RSLEvent[], day: string, camp: RSLImportCamp, party: string): RSLEvent {
    for (let rslEvent of rslEvents) {
        if (rslEvent.camp == camp.campname && rslEvent.day == day && rslEvent.title == party) {
            return rslEvent;
        }
    }
    rslId++;
    const newEvent: RSLEvent = {
        id: 'rsl-' + rslId,
        camp: camp.campname,
        day: day,
        location: cleanLocation(camp.location),
        campUID: camp.uid,
        distance: 0,
        title: party,
        wa: (camp.wheelchairfriendly.toLowerCase() == 'yes'),
        waNotes: camp.mobilitynotes,
        distanceInfo: '',
        occurrences: []
    };
    rslEvents.push(newEvent);
    return newEvent;
}
// Day - yyyy-mm-dd
// Time - '15:00:00.000000' or ''
// Return 2023-08-29T14:00:00-07:00
function toTime(day: string, time: string, startTime?: string, shift?: number): string {
    if (time == '') {
        // Assume end time is 1 hour after start
        const s = new Date(startTime!);
        s.setHours(s.getHours() + 1 + shift!);
        return toIsoString(s);
    }
    const t = time.split('.');
    return `${day}T${t[0]}-0${7 + shift!}:00`;
}

function cleanLocation(location: string): string {
    const t = location.split('&');
    let clock = t[0].trim();
    let street = t[1].trim();
    // Check if reversed
    if (t[1].includes(':')) {
        clock = t[1].trim();
        street = t[0].trim();
    }

    if (location == 'Airport Road & ') {
        return 'Airport Road';
    }
    if (street.toLowerCase().includes('plaza') || street.toLowerCase() == 'esplanade' || street.toLowerCase() == `rod's road`) {
        // Its ok, use it
    } else {
        const s = street.charAt(0);
        if (['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'].includes(s)) {
            street = s;
        } else {
            console.error(`Unknown street "${street}" in "${location}"`);
            return location;
        }
    }

    return `${clock} & ${street}`;
}

function toOccurrence(day: string, schedule: RSLImportSchedule, id: number): RSLOccurrence {
    const startTime = toTime(day, schedule.starttime,undefined, 2);
    const endTime = toTime(day, schedule.endtime, startTime,2);
    const startDateTime = new Date(startTime);
    let time = startDateTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(' ', '');
    let end = undefined;
    if (schedule.endtime != '') {
        end = new Date(endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(' ', '');
    }
    const timeRange = (end) ? `${time}-${end}` : `${time}`;

    return {
        who: schedule.djname,
        startTime,
        endTime,
        timeRange,
        time,
        end,
        id: id.toString()
    }
}

async function exportArtCarImage(name: string, folder: string): Promise<string | undefined> {
    const data = readFileSync('./scripts/artcars.json', 'utf8');
    const cars = JSON.parse(data);
    const title = name.replace(/\s+/g, '-').toLowerCase();
    for (let car of cars) {
        if (car.name == name) {
            const path = join(folder, 'images', 'ac-' + title + '.webp');
            if (!existsSync(path)) {
                await downloadImageAndConvertToWebP(car.url, path);
            }
            return 'ac-' + title + '.webp';
        }
    }
    console.error(`No image found for art car ${name}. Add "${name}" to artcars.json`);
    return undefined;
}

export async function importSchedule(rslEvents: RSLEvent[], day: string, schedule: RSLImportSchedule, camps: RSLImportCamp[], yearFolder: string, folder: string) {
    const camp = findCamp(schedule.campname, camps);
    if (camp) {
        const event = findRSLEvent(rslEvents, day, camp, schedule.partyname);
        if (schedule.artcarname.length > 0) {
            event.artCar = schedule.artcarname;
            const found = await exportArtCarImage(event.artCar, folder);
            if (found) {
            event.imageUrl = `./assets/${yearFolder}/images/${found}`;
            }
        }

        event.occurrences.push(toOccurrence(day, schedule, event.occurrences.length));
    } else {
        console.error(`Unable to find camp ${schedule.campname}`);
    }
}