import { OccurrenceSet } from "./models";

export function sameDay(d1: Date, d2: Date) {
    return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
}

export function now(): Date {
    // let d = new Date(2022, 7, randomInt(26,31), randomInt(0,23),randomInt(1,59));
    // console.log('today is simulated:',d);
    // return d;
    return new Date();
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