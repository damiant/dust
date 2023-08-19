import { readFileSync, readdirSync } from "fs";

export function getTSV(filename: string): any[] {
    let csv = readFileSync(filename, 'utf-8');
    const result = [];
    const lines = csv.split('\r\n');
    const colNames = [];
    let i = 0;
    for (const line of lines) {
      if (i == 0) {
        const titles = line.split('\t');
        for (let title of titles) {
          colNames.push(title.replace(/ /g, '').toLowerCase());
        }      
      } else {
        const cols = line.split('\t');
        const data = {};
        let c = 0;
        for (let col of cols) {
          Object.defineProperty(data, `${colNames[c]}`, { value: col, enumerable: true });        
          c++;
        }
        result.push(data);
      }
      i++;
    }
    return result;
  }

  export function scheduleFilesIn(folder: string): string[] {
    return readdirSync(folder).filter(f => !f.includes('Camp Info') && f.endsWith('.tsv'));
  }