import { environment } from 'src/environments/environment';
import { MapInfo, MapPoint, Pin } from '../data/models';
import { GpsCoord } from './geo.utils';

// Streets from Esplanade to K in relative values from center
export const streets = [
  0.283, // Esplanade
  0.335, // A
  0.367, // B
  0.400, // C
  0.430, // D
  0.462, // E
  0.519, // F
  0.553, // G
  0.584, // H
  0.615, // I
  0.641, // J
  0.670 // K
];

export const defaultMapRadius = 5000;

export function toMapPoint(location: string | undefined, info?: MapInfo, pin?: Pin, facing?: string): MapPoint {
  if (!location) {
    if (pin) {
      return { street: '', clock: '', x: pin.x, y: pin.y, info };
    }
    return { street: '', clock: '' };
  }
  let l = location.toLowerCase();
  if (l.includes('ring road')) {
    // eg rod's ring road @ 7:45
    return convertRods(l, info);
  }
  if (l.includes(`rod's road`)) {
    // eg 6:00 & rod's road
    if (l.includes('&')) {
      l = `rod's ring road @ ${l.split('&')[0].trim()}`;
    }
    return convertRods(l, info);
  }
  if (l.includes('open playa') || l.includes(`'`)) {
    return convertArt(l, info);
  }
  if (l.includes('portal')) {
    l = l.replace('portal', '& esplanade');
  }
  if (l.includes('center camp plaza')) {
    l = '6:00 & A';
  } else if (l.includes('plaza')) {
    // 9:00 B Plaza
    l = l.replace('plaza', '');
    if (!l.includes('&')) {
      l = l.replace(' ', ' & ');
    }
  }

  const tmp = l.split('&');
  const mp: MapPoint = (tmp[0].includes(':')) ? {
    street: tmp[1]?.trim(),
    clock: tmp[0]?.trim(),
    info
  } :
    {
      street: tmp[0]?.trim(),
      clock: tmp[1]?.trim(),
      info
    };


  if (facing) {
    // This shifts off the street so that the camp is facing the man
    if (facing.includes('facing man')) {
      mp.streetShift = 0.007;
    }
    // This shifts off the street so that the camp is facing the mountain
    if (facing.includes('facing mountain')) {
      mp.streetShift = -0.007;
    }
    // This shifts so the camp faces towards 10 on the map
    if (facing.includes('& 10:00')) {
      mp.clockShift = -0.03;
    }
    if (facing.includes('facing 10:00')) {
      mp.clockShift = -0.07;
    }
    // This shifts so the camp faces towards 10 on the map
    if (facing.includes('& 2:00')) {
      mp.clockShift = 0.03;
    }
    if (facing.includes('facing 2:00')) {
      mp.clockShift = 0.07;
    }
  }

  return mp;
}

export function mapPointToPoint(mapPoint: MapPoint, circleRadius: number) {
  if (mapPoint.clock == '' && mapPoint.street == '' && mapPoint.x && mapPoint.y) {
    // If its a pin then dont use clock/street
    return { x: mapPoint.x, y: mapPoint.y };
  }
  const clock = clockOffset(toClock(mapPoint.clock), mapPoint.clockShift);
  const rad = streetOffset(toStreetRadius(mapPoint.street), mapPoint.streetShift);
  const circleRad = circleRadius;
  return getPoint(clock, rad, circleRad);
}

const streetCache = new Map<string, number>();

export function toStreetRadius(street: string): number {
  try {
    if (streetCache.has(street)) {
      return streetCache.get(street)!;
    }
    let result = 0;
    const acode = 'a'.charCodeAt(0);
    const streetL = street.toLowerCase();
    const c = streetL.charCodeAt(0) - acode;
    if (streetL == 'airport road') {
      return 0.8;
    }
    if (streetL == 'esplanade') {
      return streets[0];
    }
    result = streets[c + 1];
    streetCache.set(street, result);
    return result;
  } catch {
    console.error(`Unable to find street ${street}`);
    return 0;
  }
}

export function toRadius(feet: number): number {
  // 2500ft from man to esplanade
  return (feet / 2500.0) * streets[0];
}

export const maxDistance = 9999;

export function distance(g1: GpsCoord, g2: GpsCoord) {
  if (!g2 || !g1) {
    return maxDistance;
  }
  if (g1.lat == g2.lat && g1.lng == g2.lng) {
    return 0;
  } else {
    var radlat1 = (Math.PI * g1.lat) / 180;
    var radlat2 = (Math.PI * g2.lat) / 180;
    var theta = g1.lng - g2.lng;
    var radtheta = (Math.PI * theta) / 180;
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
      dist = 1;
    }
    dist = Math.acos(dist);
    dist = (dist * 180) / Math.PI;
    dist = dist * 60 * 1.1515;
    if (isNaN(dist)) {
      return maxDistance;
    }
    return dist;
  }
}

export function formatDistance(dist: number): string {
  if (dist == maxDistance) {
    return '';
  }
  if (!imperial()) {
    dist = dist * 1.60934;
  }
  const rounded = Math.round(dist * 10) / 10;
  if (rounded == 0.0) {
    return '(near)';
  } else if (rounded > 100) {
    return '(far)';
  }
  return `(${rounded}${imperial() ? 'mi' : 'km'})`;
}

export function imperial(): boolean {
  return navigator.language.toLowerCase().includes('-us');
}

export function formatDistanceMiles(dist: number, short = false): string {
  if (dist == maxDistance) {
    return '';
  }
  if (imperial()) {
    return short ?
      `${Math.round(dist * 10) / 10}mi` :
      `${Math.round(dist * 10) / 10} miles`;
  } else {
    const km = dist * 1.60934;
    return short ?
      `${Math.round(km * 10) / 10}km` :
      `${Math.round(km * 10) / 10} km`;
  }
}

export function formatDistanceNice(dist: number): string {
  return (dist >= 0.25) ? formatDistanceMiles(dist) : formatDistanceFt(dist);
}

export function formatDistanceNiceShort(dist: number): string {
  return (dist >= 0.25) ? formatDistanceMiles(dist, true) : formatDistanceFt(dist).replace(' ', '');
}

export function formatDistanceFt(dist: number): string {
  if (dist == maxDistance) {
    return '';
  }
  if (imperial()) {
    const rounded = Math.round(dist * 5280.0);
    return `${rounded} ft`;
  } else {
    const metres = Math.round(dist * 1.60934 * 1000);
    return `${metres} m`;
  }
}

export function mapPointToPin(point: MapPoint, mapRadius: number): Pin | undefined {
  if (point.x && point.y) {
    return {
      x: point.x,
      y: point.y,
    };
  }
  if (point.street !== '') {
    if (!point.clock) {
      if (point.street == 'airport road') {
        point.clock = '5:00';
      } else if (point.street == 'none' || point.street == 'mobile') {
        return undefined;
      } else {
        if (!environment.production) {
          //console.error('Invalid Point', point);
        }
        return undefined;
      }
    }
    return plot(
      clockOffset(toClock(point.clock), point.clockShift),
      streetOffset(toStreetRadius(point.street), point.streetShift),
      undefined, mapRadius);
  } else if (point.feet) {
    if (point.streetOffset && point.clockOffset) {
      const offset = getPoint(toClock(point.clockOffset), toStreetRadius(point.streetOffset), mapRadius);
      const center = getPoint(0, 0, mapRadius);
      offset.x -= center.x;
      offset.y -= center.y;
      return plot(toClock(point.clock), toRadius(point.feet), offset, mapRadius);
    } else {
      return plot(toClock(point.clock), toRadius(point.feet), undefined, mapRadius);
    }
  }
  return undefined;
}

function streetOffset(radius: number, streetShift?: number): number {
  if (streetShift) {
    return radius + streetShift;
  }
  return radius;
}

function clockOffset(clock: number, clockShift?: number): number {
  if (clockShift) {
    return clock + clockShift;
  }
  return clock;
}

export function locationStringToPin(location: string, mapRadius: number, facing: string | undefined): Pin | undefined {
  if (!location) return undefined;
  if (location.toLowerCase().includes('center camp')) {
    location = '6:00 & A';
  }
  if (location.toLowerCase().includes('man pavilion')) {
    location = "12:00 1', Open Playa";
  }
  const pin = mapPointToPin(toMapPoint(location, undefined, undefined, facing), mapRadius);
  if (pin == undefined && location !== 'None' && location !== 'Mobile') {
    console.warn(`Location "${location}" could not be found`);
  }
  return pin;
}

function plot(clock: number, rad: number, offset: any, radius: number) {
  const pt = getPoint(clock, rad, radius);
  if (offset) {
    pt.x += offset.x;
    pt.y += offset.y;
  }
  return pt;
}

export function getPoint(clock: number, rad: number, circleRadius: number): Pin {
  const pt = getPointOnCircle(rad * circleRadius, clockToDegree(clock));
  pt.x += circleRadius;
  pt.y += circleRadius;
  return pt;
}

export function clockToDegree(c: number): number {
  const r = 30.0 // 360 / 12;
  return (c - (3 % 12)) * r;
}

const radianMultiplier = Math.PI / 180;

export function getPointOnCircle(radius: number, degree: number): Pin {
  const radian = degree * radianMultiplier;
  const x = radius * Math.cos(radian);
  const y = radius * Math.sin(radian);
  return { x, y };
}

const clockCache = new Map<string, number>();
// eg 2:45 => 2.75
export function toClock(clock: string): number {
  if (!clock) {
    console.error(`Invalid clock string`);
    return 0;
  }
  if (clockCache.has(clock)) {
    return clockCache.get(clock)!;
  }
  const tmp = clock.split(':');
  const v = parseInt(tmp[1]) / 60.0; // eg 2:45 => 45/60 => 0.75
  const result = parseInt(tmp[0]) + v;
  clockCache.set(clock, result);
  return result;
}

export function calculateRelativePosition(you: GpsCoord, pin: GpsCoord, compassRotation: number, arrows = false): string {
  // Convert degrees to radians
  const degToRad = (degrees: number) => degrees * (Math.PI / 180);
  const radToDeg = (radians: number) => radians * (180 / Math.PI);

  // Convert degrees to radians
  const userLat = degToRad(you.lat);
  const userLon = degToRad(you.lng);
  const pinLat = degToRad(pin.lat);
  const pinLon = degToRad(pin.lng);

  // Haversine formula to calculate distance
  // const dLat = pinLat - userLat;
  // const dLon = pinLon - userLon;
  // const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
  //   Math.cos(userLat) * Math.cos(pinLat) *
  //   Math.sin(dLon / 2) * Math.sin(dLon / 2);
  // const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  // const distance = R * c;

  // Bearing formula
  const y = Math.sin(pinLon - userLon) * Math.cos(pinLat);
  const x = Math.cos(userLat) * Math.sin(pinLat) -
    Math.sin(userLat) * Math.cos(pinLat) * Math.cos(pinLon - userLon);
  const bearingToPin = Math.atan2(y, x);

  // Convert bearing to degrees
  let bearingToPinDeg = radToDeg(bearingToPin);
  if (bearingToPinDeg < 0) bearingToPinDeg += 360;

  // Calculate difference between bearing and heading
  let angleDiff = bearingToPinDeg - compassRotation;
  angleDiff = (angleDiff + 180) % 360 - 180;

  // ↖ ↗ ↙ ↘ ↑ ← ↓ →
  if (arrows) {
    if (angleDiff > -22.5 && angleDiff <= 22.5) {
      return '↑';
    } else if (angleDiff > 22.5 && angleDiff <= 67.5) {
      return '↗';
    } else if (angleDiff > 67.5 && angleDiff <= 112.5) {
      return '→';
    } else if (angleDiff > 112.5 && angleDiff <= 157.5) {
      return '↘';
    } else if (angleDiff > 157.5 || angleDiff <= 202.5) {
      return '↓';
    } else if (angleDiff > 202.5 && angleDiff <= 247.5) {
      return '↙';
    } else if (angleDiff > 247.5 && angleDiff <= 292.5) {
      return '←';
    } else if (angleDiff > 292.5 && angleDiff <= 337.5) {
      return '↖';
    } else if (angleDiff > 337.5) {
      return '↑';
    } else {
      return '·';
    }
  } else {
    // Determine relative position
    if (angleDiff > -45 && angleDiff <= 45) {
      return 'ahead of you';
    } else if (angleDiff > 45 && angleDiff <= 135) {
      return 'to the right';
    } else if (angleDiff > 135 || angleDiff <= -135) {
      return 'behind you';
    } else {
      return 'to the left';
    }
  }
}

function convertArt(l: string, info?: MapInfo): MapPoint {
  const tmp = l.split(' ');
  const clock = tmp[0].trim();
  const feet = parseInt(tmp[1].trim().replace(`'`, ''));
  return { street: '', clock, feet, info };
}

function convertRods(l: string, info?: MapInfo): MapPoint {
  if (l.includes('&')) {
    // May be rod's ring road & D
    return { street: 'd', clock: '6:00', info };
  }
  const tmp = l.split('@');
  const clock = tmp[1].trim();
  return { street: '', clock, feet: 650, streetOffset: 'b', clockOffset: '6:00' };
}
