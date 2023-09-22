import { Injectable } from '@angular/core';
import { Art, Camp, Dataset, Revision } from './models';
import { datasetFilename, getLive, getLiveBinary } from './api';
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
  revision = 'revision',
  map = 'map'
}



@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private settingsService: SettingsService, private dbService: DbService) {
  }

  public async sendDataToWorker(defaultRevision: number, hideLocations: boolean, mapIsOffline: boolean): Promise<boolean> {

    const ds = this.settingsService.settings.datasetId;
    try {
      const revision: Revision = await this.read(ds, Names.revision);
      if (!revision) {
        console.warn(`Read from app storage`);
        return false;
      }
      const mapUri = await this.getUri(ds, Names.map, 'svg');
      const exists = await this.stat(ds, Names.map, 'svg');
      if (exists) {
        console.info(`${ds} map is ${mapUri}`);
      } else {
        console.error(`${ds} map not found at ${mapUri}`);
      }
      this.settingsService.settings.mapUri = mapIsOffline ? '' : mapUri;
      this.settingsService.save();
      if (revision.revision <= defaultRevision && mapIsOffline) {
        console.warn(`Did not read data from storage as it is at revision ${revision.revision} but current is ${defaultRevision}`);
        return false;
      }
    } catch (err) {
      console.error(`Unable read revision`, err);
      return false;
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
    return true;
  }

  private async read(dataset: string, name: Names): Promise<any> {
    return (await this.get(this.getId(dataset, name), []));
  }

  private badData(events: Event[], art: Art[], camps: Camp[]): boolean {
    return (!camps || camps.length == 0 || !art || !events || events.length == 0);
  }

  public async loadDatasets(): Promise<Dataset[]> {
    const d = await this.get(Names.datasets, []);
    if (d.length == 0) {
      console.warn('Read datasets from app');
      const res = await fetch('assets/datasets/datasets.json');
      return await res.json();
    } else {
      return d;
    }
  }

  public async download(dataset: Dataset | undefined) {
    const lastDownload = this.settingsService.getLastDownload();
    const mins = minutesBetween(now(), lastDownload);
    let latest = '';
    let revision: Revision = { revision: 0 };
    if (mins < 5) {
      console.log(`Downloaded ${mins} minutes ago (${lastDownload})`);
      return;
    }
    try {
      const datasets: Dataset[] = await getLive('datasets', Names.datasets, 1000);
      console.log(datasets);
      await this.save(Names.datasets, datasets);
      latest = datasetFilename(dataset ? dataset : datasets[0]);

      console.log(`get revision live ${latest}`);
      revision = await getLive(latest, Names.revision, 1000);
      console.log(`Live revision is ${JSON.stringify(revision)}`);

      // Check the current revision
      const id = this.getId(latest, Names.revision);
      const currentRevision: Revision = await this.get(id, { revision: 0 });
      console.log(`Current revision is ${JSON.stringify(currentRevision)}`);

      if (revision && currentRevision && currentRevision.revision !== null && revision.revision === currentRevision.revision) {
        console.log(`Will not download data for ${latest} as it is already at revision ${currentRevision.revision}`);
        this.rememberLastDownload();
        return;
      }
    } catch (err) {
      console.log('Possible CORs error as document location is ', document.location.href);
      console.error('Unable to download', err);
      return;
    }

    const events = await getLive(latest, Names.events);
    const art = await getLive(latest, Names.art);
    const camps = await getLive(latest, Names.camps);
    const rsl = await getLive(latest, Names.rsl);
    const mapData = await getLiveBinary(latest, Names.map, 'svg');
    if (this.badData(events, art, camps)) {
      console.error(`Download failed`);
      return;
    }
    console.log('saving data...');
    await this.save(this.getId(latest, Names.events), events);
    await this.save(this.getId(latest, Names.camps), camps);
    await this.save(this.getId(latest, Names.art), art);
    await this.save(this.getId(latest, Names.rsl), rsl);
    let uri = await this.saveBinary(this.getId(latest, Names.map), 'svg', mapData);
    await this.save(this.getId(latest, Names.revision), revision);
    if (uri.startsWith('/DATA/')) {
      uri = `https://data.dust.events/${latest}/map.svg`;
    }
    console.log('map data was set to ' + uri);
    //this.settingsService.settings.mapUri = uri;
    this.rememberLastDownload();
  }

  private rememberLastDownload() {
    this.settingsService.settings.lastDownload = now().toISOString();
    this.settingsService.save();
  }

  private getId(dataset: string, name: string): string {
    return `${dataset}-${name}`;
  }

  private async getUri(dataset: string, name: string, ext?: string): Promise<string> {
    const r = await Filesystem.getUri({ path: `${this.getId(dataset, name)}.${ext ? ext : 'txt'}`, directory: Directory.Data })
    return Capacitor.convertFileSrc(r.uri);
  }

  private async stat(dataset: string, name: string, ext?: string): Promise<boolean> {
    try {
      const s = await Filesystem.stat({ path: `${this.getId(dataset, name)}.${ext ? ext : 'txt'}`, directory: Directory.Data })
      return s.size > 0;
    } catch {
      return false;
    }
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

  private async saveBinary(id: string, ext: string, data: any): Promise<string> {
    const res = await Filesystem.writeFile({
      path: `${id}.${ext}`,
      data: data,
      directory: this.getDirectory()
    });
    return Capacitor.convertFileSrc(res.uri);
  }

  private getDirectory(): Directory {
    if (this.isAndroid()) {
      return Directory.Data;
    } else {
      return Directory.Data;//Documents;
    }
  }

  private isAndroid(): boolean {
    return (Capacitor.getPlatform() == 'android');
  }
}
