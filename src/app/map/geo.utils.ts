function affineTransformation(
  lat1: number,
  lat2: number,
  lat3: number,
  lon1: number,
  lon2: number,
  lon3: number,
  x1: number,
  x2: number,
  x3: number,
  y1: number,
  y2: number,
  y3: number,
) {
  // Compute the coefficients for the affine transformation
  let detT = lat1 * lon2 + lat2 * lon3 + lat3 * lon1 - lat2 * lon1 - lat3 * lon2 - lat1 * lon3;

  const A = (x1 * lon2 + x2 * lon3 + x3 * lon1 - x2 * lon1 - x3 * lon2 - x1 * lon3) / detT;
  const B = (lat1 * x2 + lat2 * x3 + lat3 * x1 - lat2 * x1 - lat3 * x2 - lat1 * x3) / detT;
  const C =
    (lat1 * lon2 * x3 + lat2 * lon3 * x1 + lat3 * lon1 * x2 - lat2 * lon1 * x3 - lat3 * lon2 * x1 - lat1 * lon3 * x2) /
    detT;

  const D = (y1 * lon2 + y2 * lon3 + y3 * lon1 - y2 * lon1 - y3 * lon2 - y1 * lon3) / detT;
  const E = (lat1 * y2 + lat2 * y3 + lat3 * y1 - lat2 * y1 - lat3 * y2 - lat1 * y3) / detT;
  const F =
    (lat1 * lon2 * y3 + lat2 * lon3 * y1 + lat3 * lon1 * y2 - lat2 * lon1 * y3 - lat3 * lon2 * y1 - lat1 * lon3 * y2) /
    detT;

  const det = A * E - B * D;
  const BF = B * F;
  const CE = C * E;
  const AF = A * F;
  const CD = C * D;

  return {
    toXY: function (gpsPoint: GpsCoord) {
      return {
        x: A * gpsPoint.lat + B * gpsPoint.lng + C,
        y: D * gpsPoint.lat + E * gpsPoint.lng + F
      };
    },
    toGPS: function (x: number, y: number) {
      return {
        lat: (E * x - B * y + BF - CE) / det,
        lng: (-D * x + A * y + CD - AF) / det
      };
    },
  };
}

let transform: any = undefined;

export function setReferencePoints(coords: GpsCoord[], mapXY: Point[]) {
  if (!coords || coords.length < 3 || !mapXY || mapXY.length < 3) {
    console.error(`setReferencePoints requires at least 3 GPS points and map points`);
  }
  transform = affineTransformation(
    coords[0].lat,
    coords[1].lat,
    coords[2].lat,
    coords[0].lng,
    coords[1].lng,
    coords[2].lng,
    mapXY[0].x,
    mapXY[1].x,
    mapXY[2].x,
    mapXY[0].y,
    mapXY[1].y,
    mapXY[2].y,
  );
}

export function gpsToMap(gps: GpsCoord): Point {
  if (!transform) return { x: 0, y: 0 };
  return transform.toXY(gps);
}

export function mapToGps(point: Point): GpsCoord {
  if (!transform) return { lat: 0, lng: 0 };
  return transform.toGPS(point.x, point.y);
}

export function NoGPSCoord(): GpsCoord2 {
  return { lat: 0, lng: 0, timeStamp: new Date().getTime() };
}

export function timeStampGPS(gpsCoord: GpsCoord): GpsCoord2 {
  (gpsCoord as GpsCoord2).timeStamp = new Date().getTime();
  return gpsCoord as GpsCoord2;
}

export interface GpsCoord {
  lat: number;
  lng: number;
}

export interface GpsCoord2 {
  lat: number;
  lng: number;
  timeStamp: number;
}

export interface Point {
  x: number;
  y: number;
}
