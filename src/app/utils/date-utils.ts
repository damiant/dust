import { addDays, isAfter } from './utils';

export function daysHighlighted(start: string, end: string): any[] {
  const result: any[] = [];
  let day = new Date(start);
  const endDate = new Date(end);
  while (!isAfter(day, endDate)) {
    const dayStr = day.toISOString().substring(0, 10);
    result.push({ date: dayStr, textColor: 'var(--ion-color-primary)' });
    day = addDays(day, 1);
  }
  return result;
}

export function getTimeInTimeZone(epoch: number, timeZone: string): string {
  const offset = getTimeZoneOffsetHours(timeZone);
  return new Date(epoch + offset * 60 * 60 * 1000).toISOString().replace('Z', '');
}

export function toDate(d: string | undefined): Date | undefined {
  if (!d) return undefined;
  return new Date(d);
}

export function getTimeZoneOffsetHours(timeZone: string): number {
  const date = new Date();
  const timeZoneString = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
    .formatToParts(date)
    .find((part) => part.type === 'timeZoneName')?.value;
  if (!timeZoneString) return 0;

  const match = timeZoneString.match(/GMT([+-]\d{2}):?(\d{2})?/);
  if (!match) return 0;

  const hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;

  return hours + minutes / 60; // Convert minutes to fraction of an hour
}
