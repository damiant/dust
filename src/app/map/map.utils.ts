import { MapInfo, MapPoint } from "../models";

// Streets from Esplanade to K in relative values from center
const streets = [0.285, 0.338, 0.369, 0.405, 0.435, 0.465, 0.525, 0.557, 0.590, 0.621, 0.649, 0.678];

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

export function toStreetRadius(street: string): number {
    try {
        const acode = 'a'.charCodeAt(0);
        const c = street.toLowerCase().charCodeAt(0) - acode;

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


export function getPoint(clock: number, rad: number, circleRadius: number) {
    const pt = getPointOnCircle(rad * circleRadius, clockToDegree(clock));
    pt.x += circleRadius;
    pt.y += circleRadius;
    return pt;
}

export function clockToDegree(c: number): number {
    const r = 360 / 12;
    return (c - 3 % 12) * r;
}

export function getPointOnCircle(radius: number, degree: number) {
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
