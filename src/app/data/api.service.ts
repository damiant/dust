import { Injectable } from '@angular/core';
import { Art, Camp, Dataset, Revision } from './models';
import { datasetFilename, getLive } from './api';
import { SettingsService } from './settings.service';
import { minutesBetween, now } from '../utils/utils';
import { DbService } from './db.service';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

enum Names {
  datasets = 'datasets',
  events = 'events',
  art = 'art',
  camps = 'camps',
  rsl = 'rsl',
  revision = 'revision'
}



@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private settingsService: SettingsService, private dbService: DbService) {
  }

  public async sendDataToWorker(defaultRevision: number, hideLocations: boolean) {

    const ds = this.settingsService.settings.dataset;
    try {
      const revision: Revision = await this.read(ds, Names.revision);
      if (!revision) {
        console.warn(`Read from app storage`);
        return;
      }
      if (revision.revision <= defaultRevision) {
        console.warn(`Did not read data from storage as it is at revision ${revision.revision} but current is ${defaultRevision}`);
        return;
      }
    } catch (err) {
      console.error(`Unable read revision`, err);
      return;
    }
    const events = await this.getUri(ds, Names.events);
    const art = await this.getUri(ds, Names.art);
    const camps = await this.getUri(ds, Names.camps);
    const rsl = await this.getUri(ds, Names.rsl);    
    await this.dbService.setDataset({
      dataset: ds,
      events,
      camps,
      art,
      rsl,
      hideLocations
    });
  }

  private async read(dataset: string, name: Names): Promise<any> {
    return (await this.get(this.getId(dataset, name), []));
  }

  private badData(events: Event[], art: Art[], camps: Camp[]): boolean {
    return (!camps || camps.length == 0 || !art || art.length == 0 || !events || events.length == 0);
  }

  public async download() {
    const lastDownload = this.settingsService.getLastDownload();
    const mins = minutesBetween(now(), lastDownload);
    if (mins < 60) {
      console.log(`Downloaded ${mins} minutes ago (${lastDownload})`);
      return;
    }
    const datasets: Dataset[] = await getLive('datasets', Names.datasets);
    await this.save(Names.datasets, datasets);
    const latest = datasetFilename(datasets[0]);
    const revision: Revision = await getLive(latest, Names.revision);
    // Check the current revision
    const id = this.getId(latest, Names.revision);
    const currentRevision: Revision = await this.get(id, { revision: 0 });

    if (revision && currentRevision && revision.revision === currentRevision.revision) {
      console.log(`Will not download data for ${latest} as it is already at revision ${currentRevision.revision}`);
      this.rememberLastDownload();
      return;
    }

    const events = await getLive(latest, Names.events);
    const art = await getLive(latest, Names.art);
    const camps = await getLive(latest, Names.camps);
    const rsl = await getLive(latest, Names.rsl);
    if (this.badData(events, art, camps)) {
      console.error(`Download failed`);
      return;
    }
    await this.save(this.getId(latest, Names.events), events);
    await this.save(this.getId(latest, Names.camps), camps);
    await this.save(this.getId(latest, Names.art), art);
    await this.save(this.getId(latest, Names.rsl), rsl);
    await this.save(this.getId(latest, Names.revision), revision);
    this.rememberLastDownload();
  }

  private rememberLastDownload() {
    this.settingsService.settings.lastDownload = now().toISOString();
    this.settingsService.save();
  }

  private getId(dataset: string, name: string): string {
    return `${dataset}-${name}`;
  }

  private async getUri(dataset: string, name: string): Promise<string> {
    const r = await Filesystem.getUri({ path: `${this.getId(dataset, name)}.txt`, directory: Directory.Data })    
    return Capacitor.convertFileSrc(r.uri);
  }

  private async get(id: string, defaultValue: any): Promise<any> {
    try {
      console.log(`Reading ${id}`);
      const contents = await Filesystem.readFile({
        path: `${id}.txt`,
        directory: this.getDirectory(),
        encoding: Encoding.UTF8,
      });
      return JSON.parse(contents.data as any);
    } catch {
      console.warn(`Unable to read ${id}. Using ${JSON.stringify(defaultValue)}`);
      return defaultValue;
    }
  }

  private async save(id: string, data: any) {
    await Filesystem.writeFile({
      path: `${id}.txt`,
      data: JSON.stringify(data),
      directory: this.getDirectory(),
      encoding: Encoding.UTF8,
    });
  }

  private getDirectory(): Directory {
    if (this.isAndroid()) {
      return Directory.Data;
    } else {
      return Directory.Documents;
    }
  }

  private isAndroid(): boolean {
    return (Capacitor.getPlatform() == 'android');
  }
}
