import { Camp, Pin } from '../data/models';
import { GpsCoord, Point } from './geo.utils';
import { MapPolygon } from './map-model';

type ApiGpsCoord = { lat?: number | string; lng?: number | string; long?: number | string };

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

  return { points, color: 'primary', opacity: 0.4, pinIndex };
}
