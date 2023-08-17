
// This imports from https://bm-innovate.s3.amazonaws.com/2023/GIS/Portable_Toilets.json
// It translates gps points to usable format and writes to restrooms.json

import fetch from 'node-fetch';
import { GISSet } from './gis';
import { GPSSet } from 'src/app/data/models';
import { writeFileSync } from 'fs';

const url = 'https://bm-innovate.s3.amazonaws.com/2023/GIS/Portable_Toilets.json';
const filename = 'src/assets/ttitd-2023/restrooms.json';

async function importPotties() {
    const res = await fetch(url, { method: 'Get' });
    const data: GISSet = (await res.json()) as GISSet;
    const result: GPSSet = { title: 'Restrooms', description: 'Tip: At night, look for the blue light on poles marking porta potty banks.', points: [] };
    for (let feature of data.features) {
        const location = feature.geometry.coordinates[0][0];
        const lat = location[0];
        const lng = location[1];
        result.points.push({ lat, lng });
    }
    writeFileSync(filename, JSON.stringify(result, undefined, 2), 'utf8');
}

importPotties();