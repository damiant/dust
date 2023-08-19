import { writeFileSync } from 'fs';
import { RSLEvent } from 'src/app/data/models';
import { join } from 'path';
import { getTSV, scheduleFilesIn } from './tsv';
import { importSchedule, toDay } from './rsl-utils';
import { RSLImportCamp } from './rsl-models';

const yearFolder = 'ttitd-2023';
const geoPath = `src/assets/${yearFolder}/geo.json`;
const filename = './scripts/rsl.csv';
const folder = `./src/assets/${yearFolder}`;
const outputFilename = join(folder, 'rsl.json');
const rslPath = './scripts/rsl';

async function importRSL() {
  const camps: RSLImportCamp[] = getTSV(join(rslPath, 'Camp Info-Table 1.tsv'));
  const rslEvents: RSLEvent[] = [];
  for (let scheduleFilename of scheduleFilesIn(rslPath)) {
    const day = toDay(scheduleFilename);
    const schedules = getTSV(join(rslPath, scheduleFilename));
    console.log(`Importing ${day}`);
    for (let schedule of schedules) {
      //console.log(JSON.stringify(schedule));
      await importSchedule(rslEvents, day, schedule, camps, yearFolder, folder);
    }        
  }
  writeFileSync(outputFilename, JSON.stringify(rslEvents, undefined, 2), 'utf8');
}

importRSL();
//loadRSL(filename, geoPath);