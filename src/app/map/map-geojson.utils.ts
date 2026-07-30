import { GpsCoord, Point } from './geo.utils';
import { MapPolygon } from './map-model';

/** Matches Burning Man city-block exports such as `map-2025.geojson`. */
interface GeoJsonPolygonGeometry {
  type: 'Polygon';
  coordinates: number[][][];
}

interface GeoJsonMultiPolygonGeometry {
  type: 'MultiPolygon';
  coordinates: number[][][][];
}

interface GeoJsonFeature {
  type: 'Feature';
  geometry: GeoJsonPolygonGeometry | GeoJsonMultiPolygonGeometry | null;
}

interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

function exteriorRings(geometry: GeoJsonPolygonGeometry | GeoJsonMultiPolygonGeometry): number[][][] {
  if (geometry.type === 'Polygon') {
    return geometry.coordinates[0] ? [geometry.coordinates[0]] : [];
  }
  return geometry.coordinates.map((polygon) => polygon[0]).filter((ring): ring is number[][] => !!ring);
}

/**
 * Loads a GeoJSON FeatureCollection of Polygons (lng/lat) and converts them
 * into map-space polygons using the dataset's GPS→map transform.
 */
export async function loadGeoJsonMapPolygons(
  url: string,
  gpsToPoints: (coords: GpsCoord[]) => Promise<Point[]>,
  style: { colorHex: number; opacity?: number } = { colorHex: 0xffffff },
): Promise<MapPolygon[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load map GeoJSON: ${url} (${response.status})`);
  }
  const data = (await response.json()) as GeoJsonFeatureCollection;
  if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
    throw new Error(`Invalid map GeoJSON FeatureCollection: ${url}`);
  }

  const rings: number[][][] = [];
  for (const feature of data.features) {
    if (!feature.geometry) continue;
    if (feature.geometry.type !== 'Polygon' && feature.geometry.type !== 'MultiPolygon') continue;
    rings.push(...exteriorRings(feature.geometry));
  }

  const gpsCoords: GpsCoord[] = [];
  const ringSizes: number[] = [];
  for (const ring of rings) {
    // Drop closing coordinate if it duplicates the first
    const open =
      ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]
        ? ring.slice(0, -1)
        : ring;
    ringSizes.push(open.length);
    for (const [lng, lat] of open) {
      gpsCoords.push({ lat, lng });
    }
  }

  const mapped = await gpsToPoints(gpsCoords);
  const polygons: MapPolygon[] = [];
  let offset = 0;
  for (const size of ringSizes) {
    const points = mapped.slice(offset, offset + size).map((point) => ({ x: point.x, z: point.y }));
    offset += size;
    if (points.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.z)).length < 3) continue;
    polygons.push({
      points,
      color: 'accent',
      colorHex: style.colorHex,
      opacity: style.opacity ?? 1,
    });
  }
  return polygons;
}
