import { Camp, Event, MapInfo, MapPoint, Pin } from '../data/models';
import { GpsCoord, Point } from './geo.utils';
import { MapPolygon } from './map-model';
import { toMapPoint } from './map.utils';

type ApiGpsCoord = { lat?: number | string; lng?: number | string; long?: number | string };

/** Three similar shades of the app primary (#f61067). */
const PRIMARY_SHADES = [0xc40e52, 0xf61067, 0xf84f8c] as const;

function normalizeGps(coord: ApiGpsCoord | undefined): GpsCoord | undefined {
  if (!coord) return undefined;
  const lat = Number(coord.lat);
  const lng = Number(coord.lng ?? coord.long);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : undefined;
}

export function getCampCenterGps(camp: Camp): GpsCoord | undefined {
  return normalizeGps((camp.gps ?? camp.gpsCoord) as ApiGpsCoord);
}

export async function getCampCenterPin(
  camp: Camp,
  gpsToPoint: (coord: GpsCoord) => Promise<Point>,
): Promise<Pin | undefined> {
  const gps = getCampCenterGps(camp);
  if (!gps) return camp.pin;
  const point = await gpsToPoint(gps);
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return camp.pin;
  return { x: point.x, y: point.y };
}

/** Stable 0–2 bucket from camp uid for coloring adjacent polygons differently. */
export function campColorShadeIndex(camp: Camp): 0 | 1 | 2 {
  const numeric = Number(camp.uid);
  if (Number.isFinite(numeric) && camp.uid.trim() !== '') {
    return (Math.abs(Math.trunc(numeric)) % 3) as 0 | 1 | 2;
  }
  let hash = 0;
  for (let i = 0; i < camp.uid.length; i++) {
    hash = (hash + camp.uid.charCodeAt(i)) % 3;
  }
  return hash as 0 | 1 | 2;
}

export function campPolygonColor(camp: Camp): number {
  return PRIMARY_SHADES[campColorShadeIndex(camp)];
}

/** Camp abbreviation for map pins/polygons (`camp.label`, else initials). */
export function campAbbreviation(camp: Camp): string {
  if (camp.label) return camp.label;
  const inits = camp.name
    .split(' ')
    .map((s) => s.charAt(0))
    .join('');
  return inits.substring(0, 2).toUpperCase();
}

export interface CampMapFeatures {
  point: MapPoint;
  polygon?: MapPolygon;
}

export async function buildCampMapFeatures(
  camp: Camp,
  gpsToPoint: (coord: GpsCoord) => Promise<Point>,
  pinIndex: number,
  href?: string,
): Promise<CampMapFeatures | undefined> {
  const pin = await getCampCenterPin(camp, gpsToPoint);
  if (!camp.location_string && !pin) return undefined;

  const point = toMapPoint(
    camp.location_string,
    {
      title: camp.name,
      location: camp.location_string ?? '',
      subtitle: '',
      imageUrl: camp.imageUrl,
      label: campAbbreviation(camp),
      href,
    },
    pin,
    camp.facing,
  );
  const polygon = await campToMapPolygon(camp, gpsToPoint, pinIndex);
  return { point, polygon };
}

export async function buildEventMapFeatures(
  event: Event,
  findCamp: (uid: string) => Promise<Camp | undefined>,
  gpsToPoint: (coord: GpsCoord) => Promise<Point>,
  pinIndex: number,
  href?: string,
): Promise<CampMapFeatures | undefined> {
  const camp = event.hosted_by_camp ? await findCamp(event.hosted_by_camp) : undefined;
  const info: MapInfo = {
    title: event.title,
    location: event.location,
    subtitle: event.camp,
    imageUrl: event.imageUrl ?? camp?.imageUrl,
    href,
  };

  if (camp) {
    const features = await buildCampMapFeatures(camp, gpsToPoint, pinIndex);
    if (features) {
      features.point.info = info;
      return features;
    }
  }

  if (!event.location && !event.pin) return undefined;
  return { point: toMapPoint(event.location, info, event.pin, event.facing) };
}

export async function campToMapPolygon(
  camp: Camp,
  gpsToPoint: (coord: GpsCoord) => Promise<Point>,
  pinIndex?: number,
): Promise<MapPolygon | undefined> {
  if (!camp.border || camp.border.length < 3) return undefined;

  const converted = await Promise.all(
    camp.border.map(async (coord) => {
      const gps = normalizeGps(coord as ApiGpsCoord);
      if (!gps) return undefined;
      const point = await gpsToPoint(gps);
      return Number.isFinite(point.x) && Number.isFinite(point.y) ? { x: point.x, z: point.y } : undefined;
    }),
  );
  const points = converted.filter((point): point is { x: number; z: number } => point !== undefined);
  if (points.length < 3) return undefined;

  return {
    points,
    color: 'primary',
    colorHex: campPolygonColor(camp),
    opacity: 1,
    label: campAbbreviation(camp),
    pinIndex,
  };
}
