import { existsSync, readFileSync, writeFileSync } from 'fs';
import { exit } from 'process';
import { RSLEvent, RSLOccurrence } from 'src/app/data/models';
import { initGeoLocation, setGeolocation } from './geo';
import { join } from 'path';
import { getTSV, scheduleFilesIn } from './tsv';
import { hashCode, importSchedule, toDay, toIsoString } from './rsl-utils';
import { RSLImportCamp } from './rsl-models';



function clean(s: string): string {
  s = s.trim();
  if (s.endsWith('"')) {
    s = s.slice(0, -1);
  }
  if (s.startsWith('"')) {
    s = s.substring(1);
  }
  return s;
}


function importLine(txt: string): RSLEvent {
  // 0 - camp name
  // 1 - title
  // 2 - location
  // 3 - day
  // 4 - time
  // 5 - end
  // 6 - who
  const cols = txt.split(',');
  const occurrences: RSLOccurrence[] = [];
  const start = getDateTime(clean(cols[3]), clean(cols[4]))!;
  const end = getDateTime(clean(cols[3]), clean(cols[5]), start);
  occurrences.push({
    time: clean(cols[4]),
    who: clean(cols[6]),
    timeRange: '',
    startTime: start,
    end: clean(cols[5]),
    endTime: end
  });
  return {
    id: hashCode(clean(cols[0])).toString(),
    camp: clean(cols[0]),
    title: clean(cols[1]),
    location: clean(cols[2]),
    day: clean(cols[3]),
    distance: 9999,
    distanceInfo: '',
    occurrences
  };
}





function getDateTime(day: string, time: string, startTime?: string): string {
  if (!time) {
    // Assume end time is 1 hour after start
    const s = new Date(startTime!);
    s.setHours(s.getHours() + 1);
    return toIsoString(s);
  }
  // Day: yyyy-mm-dd
  // time: 10:00AM
  // Format we want: 2023-08-29T14:00:00-07:00  
  const tmp = time.split(':');
  let hrs = parseInt(tmp[0]);
  const pm = tmp[1].toLowerCase().endsWith('pm');
  tmp[1] = tmp[1].substring(0, tmp[1].length - 2);
  tmp[1] = tmp[1].replace('AM', 'am');
  const min = parseInt(tmp[1]);
  if (pm) {
    hrs += 12;
  }
  const s = `${day}T${hrs.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}-07:00`;
  try {
    return s;//new Date(s).toLocaleString('en-US', { timeZone: BurningManTimeZone })
  } catch (e) {
    throw new Error(`Invalid date ${s}: ${e}`);
  }
}

function loadRSL(filename: string, geoPath: string) {
  if (!existsSync(filename)) {
    console.error(`${filename} is missing`);
    exit(1);
  }
  let csv = readFileSync(filename, 'utf-8');
  initGeoLocation(geoPath);
  const data = [];
  const lines = csv.split('\n');
  for (const line of lines) {
    const event = importLine(line);
    setGeolocation(event);
    data.push(event);
  }
  writeFileSync(outputFilename, JSON.stringify(data, undefined, 2), 'utf8');
}



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
    //console.log(rslEvents);
    break;
  }
  writeFileSync(outputFilename, JSON.stringify(rslEvents, undefined, 2), 'utf8');
}

importRSL();
//loadRSL(filename, geoPath);