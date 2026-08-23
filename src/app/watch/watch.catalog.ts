import { Art, Camp, Event, MapPoint, Names, RSLEvent } from '../data/models';
import { FavoritesService } from '../favs/favorites.service';
import { DbService } from '../data/db.service';
import { GpsCoord } from '../map/geo.utils';
import { getCampCenterGps } from '../map/camp-polygon.utils';
import { now } from '../utils/utils';

/** A named catalog row. lat/lng omitted when the place is unknown. */
export interface WatchPlace {
  name: string;
  lat?: number;
  lng?: number;
}

/** An Event or Party row. start/end are unix milliseconds. */
export interface WatchTimed {
  name: string;
  start: number;
  end: number;
  when?: string;
  lat?: number;
  lng?: number;
}

export interface WatchPoint {
  lat: number;
  lng: number;
}

export interface WatchCatalog {
  camps: WatchPlace[];
  art: WatchPlace[];
  events: WatchTimed[];
  restrooms: WatchPoint[];
  ice: WatchPoint[];
}

export function validGps(coord?: GpsCoord | null): GpsCoord | undefined {
  if (!coord) return undefined;
  const lat = Number(coord.lat);
  const lng = Number(coord.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  if (lat === 0 && lng === 0) return undefined;
  return { lat, lng };
}

export function campCoord(camp: Camp): GpsCoord | undefined {
  return getCampCenterGps(camp) ?? validGps(camp.gpsCoord);
}

export function artCoord(art: Art): GpsCoord | undefined {
  if (art.location?.gps_latitude != null && art.location?.gps_longitude != null) {
    const fromLocation = validGps({ lat: art.location.gps_latitude, lng: art.location.gps_longitude });
    if (fromLocation) return fromLocation;
  }
  return validGps(art.gpsCoords);
}

export function placesFromCamps(camps: Camp[]): WatchPlace[] {
  return camps.map((camp) => place(camp.name, campCoord(camp)));
}

export function placesFromArt(art: Art[]): WatchPlace[] {
  return art.map((item) => place(item.name, artCoord(item)));
}

export function timedFromOfficialEvents(events: Event[], at: Date): WatchTimed[] {
  const result: WatchTimed[] = [];
  for (const event of events) {
    const occurrence = event.occurrence_set?.[0];
    if (!occurrence) continue;
    const start = Date.parse(occurrence.start_time);
    const end = Date.parse(occurrence.end_time);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= at.getTime()) continue;
    result.push(timed(event.title, start, end, event.timeString, validGps(event.gpsCoords)));
  }
  return result;
}

export function timedFromParties(parties: Array<{ party: RSLEvent; gps?: GpsCoord }>, at: Date): WatchTimed[] {
  const result: WatchTimed[] = [];
  for (const { party, gps } of parties) {
    for (const occurrence of party.occurrences ?? []) {
      const start = Date.parse(occurrence.startTime);
      const end = Date.parse(occurrence.endTime);
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= at.getTime()) continue;
      const name = occurrence.who || party.title || party.camp || 'Party';
      result.push(timed(name, start, end, occurrence.timeRange || occurrence.time, gps));
    }
  }
  return result;
}

export function pointsFromMapPoints(points: MapPoint[]): WatchPoint[] {
  const result: WatchPoint[] = [];
  for (const point of points) {
    const gps = validGps(point.gps);
    if (gps) result.push(gps);
  }
  return result;
}

/**
 * Snapshot of Favorites plus Restroom and Ice points for the watch.
 * Upcoming-only for Events and Parties; items without GPS are still listed.
 */
export async function buildWatchCatalog(fav: FavoritesService, db: DbService, at: Date = now()): Promise<WatchCatalog> {
  const favs = await fav.getFavorites();
  const [camps, art, events, parties, restrooms, ice] = await Promise.all([
    db.getCampList(favs.camps ?? []),
    db.getArtList(favs.art ?? []),
    fav.getEventList(favs.events ?? [], false, [], false),
    fav.getRSLEventList(favs.rslEvents ?? []),
    db.getGPSPoints(Names.restrooms, 'Restrooms'),
    db.getGPSPoints(Names.ice, 'Ice'),
  ]);

  const partyRows = await Promise.all(
    (parties ?? []).map(async (party) => ({ party, gps: await gpsForParty(party, db) })),
  );

  const timedEvents = [...timedFromOfficialEvents(events ?? [], at), ...timedFromParties(partyRows, at)].sort(
    (a, b) => a.start - b.start,
  );

  return {
    camps: placesFromCamps(camps ?? []),
    art: placesFromArt(art ?? []),
    events: timedEvents,
    restrooms: pointsFromMapPoints(restrooms?.points ?? []),
    ice: pointsFromMapPoints(ice?.points ?? []),
  };
}

async function gpsForParty(party: RSLEvent, db: DbService): Promise<GpsCoord | undefined> {
  const direct = validGps(party.gpsCoords);
  if (direct) return direct;
  if (party.artId) {
    try {
      const art = await db.findArt(party.artId);
      const gps = art ? artCoord(art) : undefined;
      if (gps) return gps;
    } catch {
      // Art may have been removed from the dataset.
    }
  }
  if (party.campId) {
    try {
      const camp = await db.findCamp(party.campId);
      const gps = camp ? campCoord(camp) : undefined;
      if (gps) return gps;
    } catch {
      // Camp may have been removed from the dataset.
    }
  }
  return undefined;
}

function place(name: string, gps?: GpsCoord): WatchPlace {
  return gps ? { name, lat: gps.lat, lng: gps.lng } : { name };
}

function timed(name: string, start: number, end: number, when: string | undefined, gps?: GpsCoord): WatchTimed {
  const row: WatchTimed = { name, start, end };
  if (when) row.when = when;
  if (gps) {
    row.lat = gps.lat;
    row.lng = gps.lng;
  }
  return row;
}
