import { Injectable } from '@angular/core';
import PouchDB from 'pouchdb';
import { Dataset } from './models';
import { datasetFilename, getLive } from './api';
import { SettingsService } from './settings.service';
import { minutesBetween, now } from './utils';
import { DbService } from './db.service';

enum Names {
  datasets = 'datasets',
  events = 'events',
  art = 'art',
  camps = 'camps'
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private db!: PouchDB.Database;
  constructor(private settingsService: SettingsService, private dbService: DbService) {
    this.db = new PouchDB(`datasets`);
  }

  public async sendDataToWorker() {
    const ds = this.settingsService.settings.dataset;
    this.dbService.setDataset(
      ds,
      await this.read(ds, Names.events),
      await this.read(ds, Names.camps),
      await this.read(ds, Names.art)
    );
  }

  private async read(dataset: string, name: Names): Promise<any> {
    return (await this.get(this.getId(dataset, name), [])).data;
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
    const events = await getLive(latest, Names.events);
    const art = await getLive(latest, Names.art);
    const camps = await getLive(latest, Names.camps);
    await this.save(this.getId(latest, Names.events), events);
    await this.save(this.getId(latest, Names.camps), camps);
    await this.save(this.getId(latest, Names.art), art);
    console.log(`Downloaded data`, latest);
    this.settingsService.settings.lastDownload = now().toISOString();
    this.settingsService.save();
  }

  private getId(dataset: string, name: string): string {
    return `${dataset}-${name}`;
  }

  private async get(id: string, defaultValue: any): Promise<any> {
    try {
      return await this.db.get(id);
    } catch {
      return { _id: id, data: defaultValue };
    }
  }

  private async save(id: string, data: any) {
    const doc = await this.get(id, data);
    doc.data = data;
    await this.db.put(doc);
  }
}
