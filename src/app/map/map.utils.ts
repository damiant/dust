import { MapInfo, MapPoint, Pin } from "../models";
import { GpsCoord } from "./geo.utils";

// Streets from Esplanade to K in relative values from center
export const streets = [0.285, 0.338, 0.369, 0.405, 0.435, 0.465, 0.525, 0.557, 0.590, 0.621, 0.649, 0.678];

export function toMapPoint(location: string | undefined, info?: MapInfo): MapPoint {
    if (!location) {
        return { street: '', clock: '' };
    }
    let l = location.toLowerCase();
    if (l.includes('ring road')) {
        // eg rod's ring road @ 7:45
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
        l = l.replace(' ', ' & ');

    }
    const tmp = l.split('&');
    if (tmp[0].includes(':')) {
        return {
            street: tmp[1]?.trim(),
            clock: tmp[0]?.trim(),
            info
        }
    } else {
        return {
            street: tmp[0]?.trim(),
            clock: tmp[1]?.trim(),
            info
        }
    }
}

export function mapPointToPoint(mapPoint: MapPoint, circleRadius: number) {
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
    const pixels = feet / 2500.0 * toEspanade;
    return pixels;
}


export const maxDistance = 9999;

export function distance(g1: GpsCoord, g2: GpsCoord) {
    if (!g2 || !g1) { return maxDistance; }
    if ((g1.lat == g2.lat) && (g1.lng == g2.lng)) {
        return 0;
    }
    else {
        var radlat1 = Math.PI * g1.lat / 180;
        var radlat2 = Math.PI * g2.lat / 180;
        var theta = g1.lng - g2.lng;
        var radtheta = Math.PI * theta / 180;
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        if (dist > 1) {
            dist = 1;
        }
        dist = Math.acos(dist);
        dist = dist * 180 / Math.PI;
        dist = dist * 60 * 1.1515;
        if (isNaN(dist)) {
            return maxDistance;
        }
        return dist;
    }
}
export function mapPointToPin(point: MapPoint, mapRadius: number): Pin | undefined {
    if (point.x && point.y) {
        return {
            x: point.x,
            y: point.y
        }
    }
    if (point.street !== '') {
        if (!point.clock) {
            if (point.street == 'airport road') {
                point.clock = '5:00';
            } else if (point.street == 'none') {
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
    if (pin == undefined && location !== 'None') {
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
    return (c - 3 % 12) * r;
}

export function getPointOnCircle(radius: number, degree: number): Pin {
    const radian = degree * Math.PI / 180;
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
