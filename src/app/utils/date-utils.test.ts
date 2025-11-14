import { describe, it, expect } from 'vitest';
import {
  daysHighlighted,
  getTimeInTimeZone,
  toDate,
  getTimeZoneOffsetHours,
} from './date-utils';

describe('date-utils', () => {
  describe('toDate', () => {
    it('should return undefined for undefined input', () => {
      expect(toDate(undefined)).toBeUndefined();
    });

    it('should convert Burning Man 2024 start date string to Date', () => {
      // Real scenario from dataset: Burning Man 2024 started Aug 25
      const dateStr = '2024-08-25';
      const result = toDate(dateStr);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(7); // August is month 7 (0-indexed)
      // Date strings without time are parsed as UTC midnight
      expect(result?.getUTCDate()).toBe(25);
    });

    it('should convert Burning Man 2024 end date string to Date', () => {
      // Real scenario from dataset: Burning Man 2024 ended Sept 2
      const dateStr = '2024-09-02';
      const result = toDate(dateStr);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(8); // September is month 8 (0-indexed)
      // Date strings without time are parsed as UTC midnight
      expect(result?.getUTCDate()).toBe(2);
    });

    it('should handle ISO datetime strings from event occurrences', () => {
      // Real scenario: event occurrence times include full ISO strings
      const dateStr = '2024-08-28T14:30:00.000Z';
      const result = toDate(dateStr);
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe(dateStr);
    });
  });

  describe('getTimeZoneOffsetHours', () => {
    it('should return correct offset for Burning Man timezone (America/Los_Angeles)', () => {
      // Primary scenario: Burning Man uses Pacific timezone
      const offset = getTimeZoneOffsetHours('America/Los_Angeles');
      // PST is -8, PDT is -7 (DST active in late August/early September)
      expect(offset).toBeGreaterThanOrEqual(-8);
      expect(offset).toBeLessThanOrEqual(-7);
    });

    it('should return 0 for UTC timezone', () => {
      // Baseline scenario: UTC has no offset
      const offset = getTimeZoneOffsetHours('UTC');
      expect(offset).toBe(0);
    });

    it('should handle positive offsets for Eastern timezones', () => {
      // Regional burn scenario: events in Asia/Pacific region
      const offset = getTimeZoneOffsetHours('Asia/Tokyo');
      expect(offset).toBe(9);
    });

    it('should handle America/New_York timezone', () => {
      // Regional burn scenario: East coast events
      const offset = getTimeZoneOffsetHours('America/New_York');
      expect(offset).toBeGreaterThanOrEqual(-5);
      expect(offset).toBeLessThanOrEqual(-4);
    });

    it('should throw error for invalid timezone', () => {
      // Edge case: invalid timezone should throw
      expect(() => getTimeZoneOffsetHours('Invalid/Timezone')).toThrow();
    });

    it('should handle timezones with 30-minute offsets', () => {
      // Edge case: some timezones have fractional hour offsets
      const offset = getTimeZoneOffsetHours('Australia/Adelaide');
      // Adelaide is UTC+9:30 or UTC+10:30 depending on DST
      expect(offset % 0.5).toBe(0); // Should be divisible by 0.5
      expect(offset).toBeGreaterThanOrEqual(9.5);
      expect(offset).toBeLessThanOrEqual(10.5);
    });
  });

  describe('getTimeInTimeZone', () => {
    it('should format time for Burning Man timezone during event', () => {
      // Real scenario: Display event time in Pacific timezone
      // Aug 28, 2024, 2:30 PM UTC = Aug 28, 2024, 7:30 AM PDT (UTC-7)
      const epoch = new Date('2024-08-28T14:30:00Z').getTime();
      const result = getTimeInTimeZone(epoch, 'America/Los_Angeles');
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('2024-08-28');
      // The function adds the timezone offset (which may be negative) to the epoch and returns ISO-ish format without Z.
      // For PDT (UTC-7), the offset is -7, so 14:30 UTC + (-7 hours as milliseconds) = 07:30 local time in result.
      // In other words, adding a negative offset subtracts hours from UTC, converting to local time.
      // Let's verify the date is correct.
      expect(result.startsWith('2024-08-28')).toBe(true);
    });

    it('should handle UTC timezone correctly', () => {
      // Baseline: UTC time should match input
      const epoch = new Date('2024-08-28T14:30:00Z').getTime();
      const result = getTimeInTimeZone(epoch, 'UTC');
      
      expect(result).toContain('2024-08-28');
      expect(result).toContain('14:30:00');
    });

    it('should handle calendar reminder scenario with timezone offset', () => {
      // Real scenario from favs.page.ts: Adding calendar reminders with timezone adjustment
      const eventStart = new Date('2024-08-30T20:00:00Z').getTime();
      const offset = getTimeZoneOffsetHours('America/Los_Angeles');
      
      // This mimics the calendar reminder logic
      const adjustedTime = eventStart + (offset * 60 * 60 * 1000);
      const result = new Date(adjustedTime).toISOString();
      
      expect(result).toBeDefined();
      expect(result).toContain('2024-08-30');
    });
  });

  describe('daysHighlighted', () => {
    it('should highlight all days for Burning Man 2024 event week', () => {
      // Real scenario: Burning Man 2024 dates (Aug 25 - Sept 2)
      const start = '2024-08-25';
      const end = '2024-09-02';
      const result = daysHighlighted(start, end);
      
      // 9 days total (Aug 25, 26, 27, 28, 29, 30, 31, Sept 1, 2)
      expect(result).toHaveLength(9);
      expect(result[0].date).toBe('2024-08-25');
      expect(result[8].date).toBe('2024-09-02');
      
      // All should have primary color for calendar highlighting
      result.forEach(day => {
        expect(day.textColor).toBe('var(--ion-color-primary)');
      });
    });

    it('should handle single day regional burn', () => {
      // Real scenario: Some regional burns are single-day events
      const start = '2024-06-15';
      const end = '2024-06-15';
      const result = daysHighlighted(start, end);
      
      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2024-06-15');
      expect(result[0].textColor).toBe('var(--ion-color-primary)');
    });

    it('should handle typical 3-day regional burn', () => {
      // Real scenario: Many regional burns are 3-day weekend events
      const start = '2024-07-19';
      const end = '2024-07-21';
      const result = daysHighlighted(start, end);
      
      expect(result).toHaveLength(3);
      expect(result[0].date).toBe('2024-07-19');
      expect(result[1].date).toBe('2024-07-20');
      expect(result[2].date).toBe('2024-07-21');
    });

    it('should handle month boundary crossing', () => {
      // Real scenario: Burning Man often crosses from August to September
      const start = '2024-08-30';
      const end = '2024-09-02';
      const result = daysHighlighted(start, end);
      
      expect(result).toHaveLength(4);
      expect(result[0].date).toBe('2024-08-30');
      expect(result[1].date).toBe('2024-08-31');
      expect(result[2].date).toBe('2024-09-01');
      expect(result[3].date).toBe('2024-09-02');
    });

    it('should handle year boundary crossing for New Years events', () => {
      // Edge case: Events that span New Year
      const start = '2024-12-30';
      const end = '2025-01-02';
      const result = daysHighlighted(start, end);
      
      expect(result).toHaveLength(4);
      expect(result[0].date).toBe('2024-12-30');
      expect(result[3].date).toBe('2025-01-02');
    });
  });
});
