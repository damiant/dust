import { MapInfo, MapPoint, Pin } from '../data/models';
import { GpsCoord } from './geo.utils';

// Streets from Esplanade to K in relative values from center
export const streets = [0.285, 0.338, 0.369, 0.405, 0.435, 0.465, 0.525, 0.557, 0.59, 0.621, 0.649, 0.678];

export const defaultMapRadius = 5000;

export function toMapPoint(location: string | undefined, info?: MapInfo, pin?: Pin): MapPoint {
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
  if (tmp[0].includes(':')) {
    return {
      street: tmp[1]?.trim(),
      clock: tmp[0]?.trim(),
      info,
    };
  } else {
    return {
      street: tmp[0]?.trim(),
      clock: tmp[1]?.trim(),
      info,
    };
  }
}

export function mapPointToPoint(mapPoint: MapPoint, circleRadius: number) {
  if (mapPoint.clock == '' && mapPoint.street == '' && mapPoint.x && mapPoint.y) {
    // If its a pin then dont use clock/street
    return { x: mapPoint.x, y: mapPoint.y };
  }
  const clock = toClock(mapPoint.clock);
  const rad = toStreetRadius(mapPoint.street);
  const circleRad = circleRadius;
  return getPoint(clock, rad, circleRad);
}

export function toStreetRadius(street: string): number {
  try {
    const acode = 'a'.charCodeAt(0);
    const c = street.toLowerCase().charCodeAt(0) - acode;
    if (street.toLowerCase() == 'airport road') {
      return 0.8;
    }
    if (street.toLowerCase() == 'esplanade') {
      return streets[0];
    }
    return streets[c + 1];
  } catch {
    console.error(`Unable to find street ${street}`);
    return 0;
  }
}

export function toRadius(feet: number): number {
  // 2500ft from man to espanade
  const toEspanade = streets[0];
  const pixels = (feet / 2500.0) * toEspanade;
  return pixels;
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

export function formatDistanceMiles(dist: number): string {
  if (dist == maxDistance) {
    return '';
  }
  if (imperial()) {
    return `${Math.round(dist * 10) / 10} miles`;
  } else {
    const km = dist * 1.60934;
    return `${Math.round(km * 10) / 10} km`;
  }
}

export function formatDistanceNice(dist: number): string {
  return (dist >= 0.25) ? formatDistanceMiles(dist) : formatDistanceFt(dist);
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
        console.error('Invalid Point', point);
        return undefined;
      }
    }
    return plot(toClock(point.clock), toStreetRadius(point.street), undefined, mapRadius);
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

export function locationStringToPin(location: string, mapRadius: number): Pin | undefined {
  if (!location) return undefined;
  if (location.toLowerCase().includes('center camp')) {
    location = '6:00 & A';
  }
  const pin = mapPointToPin(toMapPoint(location), mapRadius);
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
  const r = 360 / 12;
  return (c - (3 % 12)) * r;
}

export function getPointOnCircle(radius: number, degree: number): Pin {
  const radian = (degree * Math.PI) / 180;
  const x = radius * Math.cos(radian);
  const y = radius * Math.sin(radian);
  return { x, y };
}

// eg 2:45 => 2.75
export function toClock(clock: string): number {
  if (!clock) {
    console.error(`Invalid clock string`);
    return 0;
  }
  const tmp = clock.split(':');
  const v = parseInt(tmp[1]) / 60.0; // eg 2:45 => 45/60 => 0.75
  return parseInt(tmp[0]) + v;
}

export function calculateRelativePosition(you: GpsCoord, pin: GpsCoord, compassRotation: number): string {
  // Radius of the Earth in meters
  const R = 6371000;

  // Convert degrees to radians
  const degToRad = (degrees: number) => degrees * (Math.PI / 180);
  const radToDeg = (radians: number) => radians * (180 / Math.PI);

  // Convert degrees to radians
  const userLat = degToRad(you.lat);
  const userLon = degToRad(you.lng);
  const pinLat = degToRad(pin.lat);
  const pinLon = degToRad(pin.lng);

  // Haversine formula to calculate distance
  const dLat = pinLat - userLat;
  const dLon = pinLon - userLon;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(userLat) * Math.cos(pinLat) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

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
  console.log(`compass=${compassRotation} angleDiff=${angleDiff} bearingToPinDeg=${bearingToPinDeg} bearingToPin=${bearingToPin}`);

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
  // Convert degrees to radians
  // const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  // // Calculate difference in longitude
  // const deltaLong = toRadians(pin.lng - you.lng);

  // // Convert latitudes to radians
  // const phi1 = toRadians(you.lat);
  // const phi2 = toRadians(pin.lat);

  // // Calculate bearing angle
  // const bearingAngle = Math.atan2(
  //   Math.sin(deltaLong),
  //   Math.cos(phi2) * Math.tan(phi1) - Math.sin(phi2) * Math.cos(deltaLong)
  // );

  // // Adjust for compass rotation
  // const adjustedAngle = (bearingAngle * 180) / Math.PI - compassRotation;

  // console.log(`compass=${compassRotation} adjusted=${adjustedAngle} bearing2=${(bearingAngle * 180) / Math.PI} bearing=${bearingAngle}`);
  // // Interpret the result
  // if (adjustedAngle >= 0 && adjustedAngle < 180) {
  //   return 'ahead';
  // } else if (adjustedAngle >= 180 && adjustedAngle < 360) {
  //   return 'behind';
  // } else if (Math.abs(adjustedAngle - 90) < 10 || Math.abs(adjustedAngle - 270) < 10) {
  //   return 'to the left';
  // } else {
  //   return 'to the right';
  // }
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
