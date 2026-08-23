import { describe, it, expect } from 'vitest';
import { Art, Camp, Event, MapPoint, Reminder, RSLEvent } from '../data/models';
import {
  amenityWatchPoints,
  artCoord,
  campCoord,
  hasPlayaAddress,
  placesFromArt,
  placesFromCamps,
  pointsFromMapPoints,
  reminderDurationMs,
  timedFromOfficialEvents,
  timedFromParties,
  timedFromReminders,
  validGps,
} from './watch.catalog';

describe('validGps', () => {
  it('rejects missing, non-finite, and 0,0 coordinates', () => {
    expect(validGps(undefined)).toBeUndefined();
    expect(validGps({ lat: 0, lng: 0 })).toBeUndefined();
    expect(validGps({ lat: Number.NaN, lng: -119 })).toBeUndefined();
  });

  it('keeps a real playa coordinate', () => {
    expect(validGps({ lat: 40.78, lng: -119.21 })).toEqual({ lat: 40.78, lng: -119.21 });
  });
});

describe('placesFromCamps', () => {
  it('prefers precise gps and still lists camps without coordinates', () => {
    const withGps = {
      name: 'Center Camp',
      gps: { lat: 40.78, lng: -119.21 },
      gpsCoord: { lat: 1, lng: 2 },
    } as Camp;
    const unplaced = { name: 'Ghost Camp', gpsCoord: { lat: 0, lng: 0 } } as Camp;
    expect(placesFromCamps([withGps, unplaced])).toEqual([
      { name: 'Center Camp', lat: 40.78, lng: -119.21 },
      { name: 'Ghost Camp' },
    ]);
  });
});

describe('placesFromArt', () => {
  it('uses location GPS then gpsCoords', () => {
    const fromLocation = {
      name: 'The Man',
      location: { gps_latitude: 40.8, gps_longitude: -119.2 },
      gpsCoords: { lat: 1, lng: 2 },
    } as Art;
    const fromCoords = { name: 'Temple', gpsCoords: { lat: 40.79, lng: -119.19 } } as Art;
    expect(artCoord(fromLocation)).toEqual({ lat: 40.8, lng: -119.2 });
    expect(placesFromArt([fromCoords])).toEqual([{ name: 'Temple', lat: 40.79, lng: -119.19 }]);
  });
});

describe('timedFromOfficialEvents', () => {
  const now = new Date('2026-08-28T20:00:00.000Z');

  it('keeps upcoming occurrences and drops ended ones', () => {
    const upcoming = {
      title: 'Brunch',
      timeString: '9:00pm',
      gpsCoords: { lat: 40.78, lng: -119.21 },
      occurrence_set: [
        {
          start_time: '2026-08-28T21:00:00.000Z',
          end_time: '2026-08-28T22:00:00.000Z',
        },
      ],
    } as Event;
    const ended = {
      title: 'Yesterday',
      occurrence_set: [
        {
          start_time: '2026-08-27T21:00:00.000Z',
          end_time: '2026-08-27T22:00:00.000Z',
        },
      ],
    } as Event;
    const rows = timedFromOfficialEvents([upcoming, ended], now);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Brunch');
    expect(rows[0].when).toBe('9:00pm');
    expect(rows[0].lat).toBe(40.78);
  });
});

describe('timedFromParties', () => {
  const now = new Date('2026-08-28T20:00:00.000Z');

  it('lists art-car parties without GPS and skips ended sets', () => {
    const party = {
      camp: 'Robot Heart',
      title: 'the party',
      occurrences: [
        {
          who: 'DJ Dust',
          startTime: '2026-08-28T21:00:00.000Z',
          endTime: '2026-08-28T22:00:00.000Z',
          timeRange: '9:00-10:00pm',
          time: '9:00pm',
          id: '1',
        },
        {
          who: 'Old Set',
          startTime: '2026-08-27T21:00:00.000Z',
          endTime: '2026-08-27T22:00:00.000Z',
          timeRange: 'done',
          time: 'done',
          id: '2',
        },
      ],
    } as RSLEvent;
    const rows = timedFromParties([{ party }], now);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ name: 'DJ Dust', when: '9:00-10:00pm' });
    expect(rows[0].lat).toBeUndefined();
  });
});

describe('pointsFromMapPoints', () => {
  it('drops points without usable GPS', () => {
    const points = [
      { street: '', clock: '', gps: { lat: 40.7, lng: -119.2 } },
      { street: '', clock: '', gps: { lat: 0, lng: 0 } },
      { street: '', clock: '' },
    ] as MapPoint[];
    expect(pointsFromMapPoints(points)).toEqual([{ lat: 40.7, lng: -119.2 }]);
  });
});

describe('amenityWatchPoints', () => {
  it('calculates GPS from map pins when lat/lng is missing', async () => {
    const points = await amenityWatchPoints(
      [
        async () => ({ points: [] }),
        async () => ({ points: [{ street: '', clock: '', x: 100, y: 200 }] as MapPoint[] }),
      ],
      async (pts) => pts.map((p) => ({ ...p, gps: { lat: 40.78, lng: -119.21 } })),
    );
    expect(points).toEqual([{ lat: 40.78, lng: -119.21 }]);
  });

  it('skips a GPS file of 0,0 and uses the next source', async () => {
    const points = await amenityWatchPoints(
      [
        async () => ({ points: [{ street: '', clock: '', gps: { lat: 0, lng: 0 } }] as MapPoint[] }),
        async () => ({ points: [{ street: '', clock: '', gps: { lat: 40.7, lng: -119.2 } }] as MapPoint[] }),
      ],
      async (pts) => pts,
    );
    expect(points).toEqual([{ lat: 40.7, lng: -119.2 }]);
  });
});

describe('hasPlayaAddress', () => {
  it('rejects empty and the Choose Address placeholder', () => {
    expect(hasPlayaAddress(undefined)).toBe(false);
    expect(hasPlayaAddress('')).toBe(false);
    expect(hasPlayaAddress('Choose Address')).toBe(false);
    expect(hasPlayaAddress('3:00 & C')).toBe(true);
  });
});

describe('timedFromReminders', () => {
  const now = new Date('2026-08-28T20:00:00.000Z');

  it('keeps upcoming reminders, drops ended ones, and lists those without GPS', () => {
    const upcoming: Reminder = {
      id: '1',
      title: 'Meet at 9',
      start: '2026-08-28T21:00:00.000Z',
      address: '3:00 & C',
      notes: '',
    };
    const ended: Reminder = {
      id: '2',
      title: 'Yesterday',
      start: '2026-08-27T21:00:00.000Z',
      address: undefined,
      notes: '',
    };
    const noPlace: Reminder = {
      id: '3',
      title: 'Call camp',
      start: '2026-08-28T22:00:00.000Z',
      address: '',
      notes: '',
    };
    const rows = timedFromReminders(
      [upcoming, ended, noPlace],
      [{ lat: 40.78, lng: -119.21 }, undefined, undefined],
      now,
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ name: 'Meet at 9', lat: 40.78, lng: -119.21 });
    expect(rows[0].end - rows[0].start).toBe(reminderDurationMs);
    expect(rows[1]).toMatchObject({ name: 'Call camp' });
    expect(rows[1].lat).toBeUndefined();
  });
});

describe('campCoord', () => {
  it('falls back to derived gpsCoord when precise gps is missing', () => {
    const camp = { name: 'X', gpsCoord: { lat: 40.1, lng: -119.1 } } as Camp;
    expect(campCoord(camp)).toEqual({ lat: 40.1, lng: -119.1 });
  });
});
