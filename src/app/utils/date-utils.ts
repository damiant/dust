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

/**
 * Format a timestamp into relative time format
 * @param timestamp - milliseconds since epoch (or ISO string, or undefined)
 * @returns formatted string like "3 mins ago", "2 hrs ago", "5 days ago", etc.
 */
export function formatRelativeTime(timestamp: number | string | undefined): string {
  if (!timestamp) return '';

  let timestampMs: number;

  if (typeof timestamp === 'string') {
    // Parse ISO string to milliseconds
    const date = new Date(timestamp);
    timestampMs = date.getTime();
  } else {
    timestampMs = timestamp;
  }

  const now = new Date().getTime();
  const differenceMs = now - timestampMs;

  if (differenceMs < 0) return ''; // Future timestamp

  const seconds = Math.floor(differenceMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) {
    return seconds === 1 ? '1 second ago' : `${seconds} seconds ago`;
  } else if (minutes < 60) {
    return minutes === 1 ? '1 min ago' : `${minutes} mins ago`;
  } else if (hours < 24) {
    return hours === 1 ? '1 hr ago' : `${hours} hrs ago`;
  } else if (days < 7) {
    return days === 1 ? '1 day ago' : `${days} days ago`;
  } else if (weeks < 4) {
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  } else if (months < 12) {
    return months === 1 ? '1 month ago' : `${months} months ago`;
  } else {
    return years === 1 ? '1 year ago' : `${years} years ago`;
  }
}

/**
 * Format a timestamp into relative time format (minutes/hours only)
 * @param timestamp - milliseconds since epoch (or undefined)
 * @returns formatted string like "3 mins ago" or "2 hrs ago"
 */
export function since(timestamp: number | undefined): string {
  if (!timestamp) return '';

  const now = new Date().getTime();
  let differenceValue = (now - timestamp) / 1000;
  differenceValue /= 60;
  const mins = Math.abs(Math.round(differenceValue));

  if (mins > 60) {
    const hrs = Math.round(mins / 60);
    return `${hrs} hr${hrs === 1 ? '' : 's'} ago`;
  }

  return `${mins} min${mins === 1 ? '' : 's'} ago`;
}
