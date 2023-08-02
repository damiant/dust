import { environment } from "src/environments/environment";
import { OccurrenceSet, TimeString } from "./models";

export function sameDay(d1: Date, d2: Date) {
    return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
}

export function now(): Date {
    if (!environment.simulatedTime) {
        return new Date();
    }
    console.log(`Simulating time ${environment.simulatedTime}`);
    return new Date(environment.simulatedTime);
}

export function randomInt(min: number, max: number) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
}

export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
}

export function noDate(): Date {
    return new Date(0);
}

export function dateMatches(d: Date, occurrence: OccurrenceSet): boolean {
    const start = new Date(occurrence.start_time);
    const end = new Date(occurrence.end_time);
    return sameDay(d, start) || sameDay(d, end);
}

export function getDayName(dateStr: string) {
    var date = new Date(dateStr);
    return date.toLocaleDateString([], { weekday: 'long' });
}

export function daysBetween(date1: any, date2: any) {
    // The number of milliseconds in one day
    const ONE_DAY = 1000 * 60 * 60 * 24;

    // Calculate the difference in milliseconds
    const differenceMs = Math.abs(date1 - date2);

    // Convert back to days and return
    return Math.round(differenceMs / ONE_DAY);
}

export function minutesBetween(date2: Date, date1: Date) {
    var differenceValue = (date2.getTime() - date1.getTime()) / 1000;
    differenceValue /= 60;
    return Math.abs(Math.round(differenceValue));
}

export function addDays(date: Date, days: number) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

export function time(d: Date): string {
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

export function getOccurrenceTimeString(start: Date, end: Date, day: Date | undefined): TimeString | undefined {
    const startsToday = day && sameDay(start, day);
    const endsToday = day && sameDay(end, day);
    if (!day || startsToday || endsToday) {
        const day = start.toLocaleDateString([], { weekday: 'long' });
        const short = (endsToday && !startsToday) ?
            `Until ${time(end)} (${timeBetween(end, start)})` :
            `${time(start)} (${timeBetween(end, start)})`;

        return {
            long: `${day} ${time(start)}-${time(end)} (${timeBetween(end, start)})`,
            short
        }
    }
    return undefined;
}

function timeBetween(d1: any, d2: any): string {
    const hrs = Math.ceil(Math.abs(d1 - d2) / 36e5);
    const mins = Math.floor((Math.abs(d1 - d2) / 1000) / 60);
    return (mins < 60) ? `${mins}mins` : `${hrs}hrs`;
}