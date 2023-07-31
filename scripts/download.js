import { writeFileSync } from 'fs';
import fetch from 'node-fetch';

const key = process.env.DUST_KEY;

if (!key) {
    console.error('DUST_KEY is not set');
    exit(1);
}

async function download(name, year, filename, folder, options) {
    const url = getUrl(name, year);
    const res = await fetch(url, {
        method: 'Get', headers: { 'Authorization': `Basic ${btoa(key)}` }
    });
    let json = await res.json();

    for (let item of json) {
        if (options?.fixName && typeof item.name == 'number') {            
            item.name = item.name.toString();
            console.warn(`Replaced invalid name ${item.name}`);
        }
        if (options?.fixOccurrence) {
            if (!item.occurrence_set) {
                console.warn(`${item.title} has invalid occurrence_set and event was removed.`);
                item.occurrence_set = [];
                item.invalid = true;
            }
        }
    }
    json = json.filter((item) => !item.invalid);

    const f = `./src/assets/${folder}/${filename}.json`;
    writeFileSync(f, JSON.stringify(json, undefined, 2));
    console.log(`Wrote "${f}"`);
}

function getUrl(name, year) {
    return `https://api.burningman.org/api/v1/${name}?year=${year}`;
}


const years = process.argv.splice(2);
console.log(years);
for (const year of years) {
    console.log(`Downloading ${year}`);
    await download('art', year, 'art', `ttitd-${year}`, { fixName: true });
    await download('camp', year, 'camps', `ttitd-${year}`, { fixName: true });
    await download('event', year, 'events', `ttitd-${year}`, { fixOccurrence: true });
}

