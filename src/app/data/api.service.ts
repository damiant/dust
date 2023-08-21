import { Injectable } from '@angular/core';
import { Art, Camp, Dataset, Revision } from './models';
import { datasetFilename, getLive } from './api';
import { SettingsService } from './settings.service';
import { minutesBetween, now } from '../utils/utils';
import { DbService } from './db.service';
import { Preferences } from '@capacitor/preferences';

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

  public async sendDataToWorker(defaultRevision: number) {
    const ds = this.settingsService.settings.dataset;
    const revision: Revision = await this.read(ds, Names.revision);
    if (!revision) {
      console.warn(`Read from app storage`);
      return;
    }
    if (revision.revision <= defaultRevision) {
       console.warn(`Did not read data from storage as it is at revision ${revision.revision} but current is ${defaultRevision}`);
       return;
    }
    const events = await this.read(ds, Names.events);
    const art = await this.read(ds, Names.art);
    const camps = await this.read(ds, Names.camps);
    const rsl = await this.read(ds, Names.rsl);
    console.log(`Saved revision is ${revision.revision}`);
    if (this.badData(events, art, camps)) {
      // Download failed
      console.error('Bad data in app. Reverting to default install.');
      this.settingsService.settings.lastDownload = '';
      this.settingsService.save();      
      return;
    }
    this.dbService.setDataset(ds, events, camps, art);
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

  private async get(id: string, defaultValue: any): Promise<any> {
    try {
      const res = await Preferences.get({ key: id });
      return JSON.parse(res.value!);
    } catch {
      return defaultValue;
    }
  }

  private async save(id: string, data: any) {
    await Preferences.set({ key: id, value: JSON.stringify(data) });
  }
}
