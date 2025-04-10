import { environment } from 'src/environments/environment';
import { OccurrenceSet, TimeRange, TimeString } from '../data/models';
import { Capacitor } from '@capacitor/core';

export function sameDay(d1: Date, d2: Date) {
  return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
}

export const BurningManTimeZone = 'America/Los_Angeles';
//export const CurrentYear = 'ttitd-2023';

// Data is for dust admin generated datasets
export const data_dust_events = 'https://api.dust.events/data/'

// Static data is for burning man datasets
export const static_dust_events = 'https://api.dust.events/static/'

// Static content that was generated
export const r2data_dust_events = 'https://data.dust.events/'

/**
 * @deprecated nowAtEvent should be used instead
 */
export function now(): Date {
  if (!environment.simulatedTime) {
    return nowAtEvent(BurningManTimeZone);
  }
  return clone(environment.simulatedTime);
}

export function isWeb(): boolean {
  return Capacitor.getPlatform() == 'web';
}

export function nowAtEvent(timeZone: string): Date {
  // if (environment.simulatedTime) {
  //   return clone(environment.simulatedTime);
  // }
  let str = new Date().toLocaleString('en-US', { timeZone });
  return new Date(str);
}

export function nowRange(timeZone: string): TimeRange {
  const start = nowAtEvent(timeZone);
  const end = nowAtEvent(timeZone);
  const minute = 1000 * 60;
  start.setTime(start.getTime() - 20 * minute);
  end.setTime(end.getTime() + 60 * minute);
  return { start, end };
}

export function clone(o: any): any {
  if (typeof structuredClone === 'function') {
    return structuredClone(o);
  } else {
    return JSON.parse(JSON.stringify(o));
  }
}

export const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function timeRangeToString(timeRange: TimeRange | undefined, timeZone: string): string {
  if (!timeRange) {
    return '';
  }
  return getTimeRange(time(timeRange.start, timeZone), time(timeRange.end, timeZone));
}

/**
 * Case Insensitive Compare of 2 strings
 *
 * @export
 * @param {string} s1
 * @param {string} s2
 * @returns {boolean} true if the strings are the same
 */
export function compareStr(s1: string, s2: string): boolean {
  return s1.localeCompare(s2, undefined, { sensitivity: 'accent' }) == 0;
}

export function randomInt(min: number, max: number) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function hasValue(v: any): boolean {
  return (v !== undefined && v !== null && v !== '');
}

export function titlePlural(s: string): string {
  if ((s == 'Art' || s == 'Camps')) {
    return s;
  }
  return s + 's';
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(() => resolve(), ms));
}

export function noDate(): Date {
  return new Date(0);
}

export function dateMatches(d: Date, occurrence: OccurrenceSet): boolean {
  const startMatch = sameDay(d, new Date(occurrence.start_time));
  const endMatch = sameDay(d, new Date(occurrence.end_time));
  return (startMatch || endMatch);
}

export function uniqueId(prefix: string): string {
  return `${prefix}${Math.floor(Math.random() * 9999999)}`;
}

export function getDayName(dateStr: string) {
  var date = new Date(dateStr);
  return date.toLocaleDateString([], { weekday: 'long' }) + ` ${getOrdinalNum(date.getDate())}`;
}

export function getDayNameFromDate(date: Date): string {
  return date.toLocaleDateString([], { weekday: 'long' });
}

export function getOrdinalNum(n: number) {
  return n + (n > 0 ? ['th', 'st', 'nd', 'rd'][(n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10] : '');
}

export function daysUntil(date1: any, date2: any) {
  // The number of milliseconds in one day
  const ONE_DAY = 1000 * 60 * 60 * 24;

  // Calculate the difference in milliseconds
  const differenceMs = date1 - date2;

  // Convert back to days and return
  return Math.round(differenceMs / ONE_DAY);
}

export function minutesBetween(date2: Date, date1: Date) {
  var differenceValue = (date2.getTime() - date1.getTime()) / 1000;
  differenceValue /= 60;
  return Math.abs(Math.round(differenceValue));
}

export function isAfter(date2: Date, date1: Date) {
  return (date2.getTime() - date1.getTime()) > 0;
}

export function addDays(date: Date, days: number) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

const timeLookup: any = {
  '12:00 AM': 'Midnight',
  '12:00 PM': 'Noon'
};

const timeCache = new Map<Date, string>();

export function time(d: Date, timeZone: string): string {
  // Burning Man is in PST timezone so report it that way in the UI (useful for people looking in other timezones)
  let v = timeCache.get(d);
  if (!v) {
    v = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone })
      .toLowerCase()
      .replace(/\s|:00/g, '');
    timeCache.set(d, v);
  }
  return timeLookup[v] || v;
}

const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// eslint-disable-next-line unused-imports/no-unused-vars
export function getOccurrenceTimeString(start: Date, end: Date, day: Date | undefined, timeZone: string): TimeString | undefined {
  const startsToday = day && sameDay(start, day);
  const endsToday = day && sameDay(end, day);


  // Note: We ignore timeZone so that times in the app show as timezone of the event
  if (!day || startsToday || endsToday) {
    const day = weekdayNames[start.getDay()];
    const tz = localTimeZone;
    const endTime = time(end, tz);
    const startTime = time(start, tz);
    const short =
      endsToday && !startsToday
        ? `Until ${endTime}(${timeBetween(end, start)})`
        : `${startTime}`;
    const timeRange = getTimeRange(startTime, endTime);
    if (timeRange == 'All Day') {
      return {
        start,
        end,
        long: `${timeRange} ${day}`,
        short: timeRange
      }
    }
    // Length of time: `${ time(start, tz) }(${ timeBetween(end, start) })`;
    return {
      start,
      end,
      // Uncomment to show hours
      //long: `${ day } ${ timeRange }(${ timeBetween(end, start) })`,
      long: `${day} ${timeRange}`,
      short,
    };
  }
  return undefined;
}

function getTimeRange(from: string, to: string): string {
  if ((from == 'Midnight' || from == '12am') && to == '11:59pm') {
    return 'All Day';
  }
  if (from.endsWith('pm') && to.endsWith('pm')) {
    return `${from.replace('pm', '')} - ${to}`;
  } else if (from.endsWith('am') && to.endsWith('am')) {
    return `${from.replace('am', '')} - ${to}`;
  }
  return `${from} - ${to}`;
}

export function isWhiteSpace(s: string | undefined): boolean {
  if (!s) return true;
  if (s.trim() == '') return true;
  return false;
}

function timeBetween(d1: any, d2: any): string {
  const hrs = Math.ceil(Math.abs(d1 - d2) / 36e5);
  const mins = Math.floor(Math.abs(d1 - d2) / 60000);
  return mins < 60 ? `${mins}min${plural(mins)}` : `${hrs}hr${plural(hrs)}`;
}

export function plural(v: number): string {
  return v === 1 ? "" : "s";
}

export function secondsBetween(d1: any, d2: any): number {
  return Math.floor(Math.abs(d1 - d2) / 1000.0);
}

export function asNumber(s: string, defaultValue: number): number {
  if (!s) return defaultValue;
  const n = Number.parseFloat(s);
  if (isNaN(n)) return defaultValue;
  return n;
}

export function diffNumbers(a: number | undefined, b: number | undefined): number {
  if (a && b) {
    return a - b;
  } else {
    return 0;
  }
}

export function hashCode(s: string): number {
  return [...s].reduce(
    (hash, c) => (Math.imul(31, hash) + c.charCodeAt(0)) | 0, // extraneous ( )
    0
  );
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export function replaceAll(str: string, find: string, replace: string) {
  return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

export async function decryptString(ciphertext: string, password: string) {
  const pwUtf8 = new TextEncoder().encode(password);                                 // encode password as UTF-8
  const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8);                      // hash the password

  const ivStr = atob(ciphertext).slice(0, 12);                                        // decode base64 iv
  const iv = new Uint8Array(Array.from(ivStr).map(ch => ch.charCodeAt(0)));          // iv as Uint8Array

  const alg = { name: 'AES-GCM', iv: iv };                                           // specify algorithm to use

  const key = await crypto.subtle.importKey('raw', pwHash, alg, false, ['decrypt']); // generate key from pw

  const ctStr = atob(ciphertext).slice(12);                                          // decode base64 ciphertext
  const ctUint8 = new Uint8Array(Array.from(ctStr).map(ch => ch.charCodeAt(0)));     // ciphertext as Uint8Array
  // note: why doesn't ctUint8 = new TextEncoder().encode(ctStr) work?

  try {
    const plainBuffer = await crypto.subtle.decrypt(alg, key, ctUint8);            // decrypt ciphertext using key
    const plaintext = new TextDecoder().decode(plainBuffer);                       // plaintext from ArrayBuffer
    return plaintext;                                                              // return the plaintext
  } catch {
    throw new Error('Decrypt failed');

  }
}