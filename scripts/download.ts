import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { basename, join } from 'path';
import fetch from 'node-fetch';
import sharp from 'sharp';
import { downloadImageAndConvertToWebP } from './image-utils';

const key = process.env['DUST_KEY'];

if (!key) {
    console.error('DUST_KEY is not set');
    process.exit(1);
}

interface Options {
    fixName?: boolean;
    fixUid?: boolean;
    fixTitle?: boolean;
    fixLocation?: boolean;
    fixOccurrence?: boolean;
    convertImage?: boolean;
    removeEmail?: boolean;
}



async function download(name: string, year: string, filename: string, folder: string, options: Options): Promise<boolean> {
    const url = getUrl(name, year);
    console.log(`Downloading ${url}...`);
    const res = await fetch(url, {
        method: 'Get', headers: { 'Authorization': `Basic ${btoa(key!)}` }
    });
    let json = (await res.json()) as any[];

    const imageFolder = `./src/assets/${folder}/images`;
    if (!existsSync(imageFolder)) {
        mkdirSync(imageFolder);
    }
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

        if (item.all_day == null) {
            item.all_day = undefined;
        }
        if (item.located_at_art == null) {
            item.located_at_art = undefined;
        }
        if (item.other_location == null) {
            item.other_location = undefined;
        }
        if (item.other_location == '') {
            item.other_location = undefined;
        }
        if (item.check_location == 0) {
            item.check_location = undefined;
        }
        if (item.url == null) {
            item.url = undefined;
        }
        if (options?.removeEmail) {
            item.contact_email = undefined;
        }
        if (item.contact_email == null) {
            item.contact_email = undefined;
        }

        // Clear unneeded properties
        item.program = undefined;
        item.donation_link = undefined;
        item.guided_tours = undefined;
        item.self_guided_tour_map = undefined;
        item.year = undefined;
        if (item.location) {
            item.location.hour = undefined;
            item.location.minute = undefined;
            item.location.distance = undefined;
        }
        if (item.event_type) {
            item.event_type.id = undefined;
            item.event_type.abbr = undefined;
        }
        item.slug = undefined;


        if (item.images) {
            for (let image of item.images) {
                image.gallery_ref = undefined;
                if (options?.convertImage) {
                    console.log(image.thumbnail_url);
                    await downloadImageAndConvertToWebP(image.thumbnail_url, `${imageFolder}/${item.uid}.webp`);
                    image.thumbnail_url = `./assets/${folder}/images/${item.uid}.webp`;
                }
            }
        }

        if (item.description) {
            if (!['.', '!', '?'].includes(item.description[item.description.length - 1])) {
                item.description = item.description + '.';
                console.warn(`Added full stop to description of ${(options?.fixTitle) ? item.title : item.name}`);
            }
            if (item.description[0].toUpperCase() != item.description[0]) {
                item.description = item.description.charAt(0).toUpperCase()
                    + item.description.slice(1);
                console.warn(`Capitalized description of ${item.name}`);
            }
        }
        if (item.print_description) {
            if (!item.print_description.endsWith('.')) {
                item.print_description += '.';
            }
            if (item.print_description[0].toUpperCase() != item.print_description[0]) {
                item.print_description = item.print_description.charAt(0).toUpperCase()
                    + item.print_description.slice(1);
            }
        }
        if (item.uid == '44098') {
            if (item.title == 'Bike wash') {
                item.invalid = true;
            }
        }
        if (options?.fixLocation) {
            if (!item.location_string) {
                item.location_string = '';
            }
            if (item.location_string.endsWith(' None None')) {
                item.location_string = item.location_string.replace(' None None', '');
                item.location.string = item.location.string.replace(' None None', '');
                console.warn(`Fixed location ${item.name} to ${item.location_string}`);
            }
            item.location = undefined;
            if (item.location_string == 'None & None') {
                if (!item.description) {
                    item.invalid = true;
                    console.warn(`Camp ${item.name} has no description or location and will be removed`);
                }
            } else if (!item.description) {
                item.description = `This theme camp has no description.`;
                console.warn(`Camp ${item.name} has no description`);
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
    json = dedup(json);    
    json = json.filter((item) => !item.invalid);

    const f = `./src/assets/${folder}/${filename}.json`;
    const data = JSON.stringify(json, undefined, 2);
    const changed = compare(f, folder, data);
    if (changed) {
        save(f, folder, data);
    } else {
        console.log(`No changes in ${folder} ${filename}`);
    }
    return changed;
}

function dedup(items: any[]): any[] {
    const list = [];
    for (let item of items) {
        const copy = structuredClone(item);
        copy.uid = '';
        list.push(copy);
    }
    let idx = 0;
    for (let item of list) {
        const dup = list.findIndex((i) => JSON.stringify(i) == JSON.stringify(item));
        if (dup != idx) {
            console.error(`ERROR: Found duplicate: ${dup} ${idx} ${item.title}`);
            items[idx].invalid = true;
        }

        idx++;
    }
    return items;
}

function toTitleCase(str: string) {
    return str.replace(
        /\w\S*/g,
        function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
}

function saveRevision(folder: string) {
    const f = `./src/assets/${folder}/revision.json`;
    let revision = 0;
    if (existsSync(f)) {
        const r = JSON.parse(readFileSync(f, 'utf8'));
        revision = r.revision;
    }
    const json = { revision: revision + 1 };
    save(f, folder, JSON.stringify(json, undefined, 2));
}

function save(path: string, folder: string, data: string) {
    const filename = basename(path);
    writeFileSync(path, data, 'utf8');
    console.log(`Wrote "${path}"`);
    const p = `../dust-web/src/assets/data/${folder}`;
    if (!existsSync(p)) {
        throw new Error(`Path must exist: ${p}`);
    }
    const otherPath = join(p, filename);

    writeFileSync(otherPath, data, 'utf8');
    console.log(`Wrote "${otherPath}"`);
}

function compare(path: string, folder: string, data: string) {
    const filename = basename(path);
    if (!existsSync(path)) {
        console.log(`${path} is missing.`);
        return true;
    }
    const read = readFileSync(path, 'utf-8');
    writeComparison(read, data);
    return read !== data;
}

function writeComparison(before: string, after: string) {
    const b = JSON.parse(before);
    const a = JSON.parse(after);
    for (let item of b) {
        if (item.uid) {
            const aItem = a.find((x: any) => x.uid == item.uid);
            if (!aItem) {
                console.log('Removed item', item);
            } else if (JSON.stringify(item) !== JSON.stringify(aItem)) {
                console.log('change found in ', aItem);
            }
        }
    }
    for (let item of a) {
        if (item.uid) {
            const bItem = b.find((x: any) => x.uid == item.uid);
            if (!bItem) {
                console.log('Added item', item);
            } else if (JSON.stringify(item) != JSON.stringify(bItem)) {
                console.log('change found in ', item);
            }
        }
    }
}

function getUrl(name: string, year: string) {
    return `https://api.burningman.org/api/v1/${name}?year=${year}`;
}

async function processYears(years: string[]) {
    console.log(years);
    for (const year of years) {
        console.log(`Downloading ${year}`);
        const convertImage = (year == '2023');
        const campsChanged = await download('camp', year, 'camps', `ttitd-${year}`, { fixName: true, fixLocation: true, removeEmail: true });
        const eventsChanged = await download('event', year, 'events', `ttitd-${year}`, { fixOccurrence: true, fixTitle: true, fixUid: true });
        const artChanged = await download('art', year, 'art', `ttitd-${year}`, { fixName: true, convertImage });
        if (artChanged || campsChanged || eventsChanged) {
            saveRevision(`ttitd-${year}`);
        }
    }
}
processYears(process.argv.splice(2));


