import { existsSync, readFileSync, writeFileSync } from 'fs';
import { basename, join } from 'path';
import fetch from 'node-fetch';

const key = process.env.DUST_KEY;

if (!key) {
    console.error('DUST_KEY is not set');
    exit(1);
}

async function download(name, year, filename, folder, options) {
    const url = getUrl(name, year);
    console.log(`Downloading ${url}...`);
    const res = await fetch(url, {
        method: 'Get', headers: { 'Authorization': `Basic ${btoa(key)}` }
    });
    let json = await res.json();

    for (let item of json) {
        if (options?.fixName) {
            if (typeof item.name == 'number') {
                item.name = item.name.toString();
                console.warn(`Replaced invalid name ${item.name}`);
            }
            if (item.name.toUpperCase() === item.name) {
                item.name = toTitleCase(item.name);
            }
        }
        if (options?.fixUid) {
            item.uid = item.event_id.toString();
            item.event_id = undefined;
        }
        if (options?.fixTitle) {
            if (item.title.toUpperCase() === item.title) {
                item.title = toTitleCase(item.title);
            }          
        }
        if (options?.fixOccurrence) {
            if (!item.occurrence_set) {
                console.warn(`${item.title} has invalid occurrence_set and event was removed.`);
                item.occurrence_set = [];
                item.invalid = true;
            }
        }
    }
    json.sort((a, b) => a.uid - b.uid);
    json = json.filter((item) => !item.invalid);

    const f = `./src/assets/${folder}/${filename}.json`;
    save(f, folder, JSON.stringify(json, undefined, 2));
}

function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
}

function saveRevision(folder) {
    const f = `./src/assets/${folder}/revision.json`;
    let revision = 0;
    if (existsSync(f)) {
        const r = JSON.parse(readFileSync(f));
        revision = r.revision;
    }
    const json = { revision: revision + 1 };
    save(f, folder, JSON.stringify(json, undefined, 2));
}

function save(path, folder, data) {
    const filename = basename(path);
    writeFileSync(path, data);
    console.log(`Wrote "${path}"`);
    const p = `../dust-web/src/assets/data/${folder}`;
    if (!existsSync(p)) {
        throw new Error(`Path must exist: ${p}`);
    }
    const otherPath = join(p, filename);

    writeFileSync(otherPath, data);
    console.log(`Wrote "${otherPath}"`);
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
    await download('event', year, 'events', `ttitd-${year}`, { fixOccurrence: true, fixTitle: true, fixUid: true });
    saveRevision(`ttitd-${year}`);
}

