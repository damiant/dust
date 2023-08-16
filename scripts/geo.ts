import { readFileSync } from "fs";
import { GpsCoord, Point, mapToGps, setReferencePoints } from "src/app/map/geo.utils";
import { locationStringToPin, mapPointToPoint } from "src/app/map/map.utils";
import { GeoRef, MapPoint, RSLEvent } from "src/app/data/models";

const mapRadius = 5000;
export function setGeolocation(event: RSLEvent) {
    const pin = locationStringToPin(event.location, mapRadius);
    if (pin) {
        const gpsCoords = mapToGps({ x: pin.x, y: pin.y });
        event.gpsCoords = gpsCoords;
    } else {
        console.error(`Unable to find camp ${event.camp} for event ${event.location}`);
    }
}

export function initGeoLocation(path: string) {
    const georeferences = getGeoReferences(path);
    const gpsCoords: GpsCoord[] = [];
    const points: Point[] = [];
    for (let ref of [georeferences[0], georeferences[1], georeferences[2]]) {
        gpsCoords.push({ lat: ref.coordinates[0], lng: ref.coordinates[1] });
        const mp: MapPoint = { clock: ref.clock, street: ref.street };
        const pt = mapPointToPoint(mp, mapRadius);
        points.push(pt);
    }

    setReferencePoints(gpsCoords, points);
}

function getGeoReferences(path: string): GeoRef[] {
    const data = readFileSync(path, 'utf-8');
    return JSON.parse(data);
}