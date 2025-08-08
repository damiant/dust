// Copy online resources to www/browser/data

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path, { join } from 'path';

const outputFolder = 'www/browser/data';

async function getData(year: string, revision: number) {
  await downloadAssets(
    [
      'camps.json',
      'art.json',
      'events.json',
      'geo.json',
      'ice.json',
      'links.json',
      'medical.json',
      'map.json',
      'map.svg',
      'map-dark.svg',
      'pins.json',
      'restrooms.json',
      'revision.json',
      'rsl.json',
    ],
    year,
    revision,
  );
}

async function downloadAssets(filenames: string[], year: string, revision: number) {
  for (const filename of filenames) {
    const url = `https://api.dust.events/static/ttitd-${year}/${filename}?revision=${revision}`;
    await download(url, `static/ttitd-${year}/${filename}`);
  }
  const datasets = await download(
    `https://api.dust.events/static/datasets/datasets.json?revision=${revision}`,
    `static/datasets/datasets.json`,
  );
  for (const dataset of datasets) {
    const url = dataset.imageUrl.replace('[@static]', '');

    await download(`https://api.dust.events/static/${url}`, `static/${url}`);
  }
  const festivals = await download(
    `https://data.dust.events/festivals.json?revision=${revision}`,
    `store/festivals.json`,
  );
  for (const festival of festivals) {
    await download(`https://data.dust.events/${festival.imageUrl}`, `store/${festival.imageUrl}`);
  }
}

async function download(url: string, filename: string) {
  const res = await fetch(url);
  const p = path.dirname(join(outputFolder, filename));
  if (!existsSync(p)) {
    mkdirSync(p, { recursive: true });
  }
  if (filename.endsWith('.json')) {
    const d = await res.text();
    writeFileSync(join(outputFolder, filename), d);
    console.log(`Parsed ${url} to ${filename}`);
    return JSON.parse(d);
  } else {
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    writeFileSync(join(outputFolder, filename), buffer);
    console.log(`Downloaded ${url} to ${filename}`);
    return undefined;
  }
}

async function go() {
  if (!existsSync(outputFolder)) {
    mkdirSync(outputFolder);
  }
  const year = `${new Date().getFullYear()}`;
  const revision = 2;
  await getData(year, revision);
}

go();
