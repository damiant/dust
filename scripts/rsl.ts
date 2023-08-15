import { existsSync, readFileSync, writeFileSync } from 'fs';
import { exit } from 'process';
import { RSLEvent, RSLOccurrence } from 'src/app/models';

const filename = './scripts/rsl.csv';
const outputFilename = './scripts/rsl.json';
if (!existsSync(filename)) {
  console.error(`${filename} is missing`);
  exit(1);
}

function clean(s: string): string {
  if (s.endsWith('"')) {
    s = s.substring(0, s.length - 1);
  }
  if (s.startsWith('"')) {
    s = s.substring(1, s.length);
  }
  return s;
}

function importLine(txt: string): RSLEvent {
  const cols = txt.split(',');
  console.log(cols);
  const occurrences: RSLOccurrence[] = [];
  return {
    camp: clean(cols[0]),
    title: clean(cols[1]),
    location: clean(cols[2]),
    day: clean(cols[3]),
    occurrences
  };
}

function loadRSL(filename: string) {
  let csv = readFileSync(filename, 'utf-8');
  const data = [];
  const lines = csv.split('\n');
  for (const line of lines) {
    data.push(importLine(line));
  }
  writeFileSync(outputFilename, JSON.stringify(data, undefined, 2));
}

loadRSL(filename);