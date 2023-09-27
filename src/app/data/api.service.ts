import { Injectable } from '@angular/core';
import { Art, Camp, Dataset, Revision } from './models';
import { datasetFilename, getCached, getLive, getLiveBinary } from './api';
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
  pins = 'pins',
  links = 'links',
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
    const pins = await this.getUri(ds, Names.pins);
    const links = await this.getUri(ds, Names.links);
    const rsl = await this.getUri(ds, Names.rsl);
    await this.dbService.setDataset({
      dataset: ds,
      events,
      camps,
      art,
      pins,
      links,
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
    return await getCached(Names.datasets, Names.datasets, 5000);
  }

  public async download(selected: Dataset | undefined) {
    const lastDownload = this.settingsService.getLastDownload();
    const mins = minutesBetween(now(), lastDownload);
    let dataset = '';
    let revision: Revision = { revision: 0 };
    // if (mins < 5) {
    //   console.log(`Downloaded ${mins} minutes ago (${lastDownload})`);
    //   return;
    // }
    try {
      const datasets: Dataset[] = await getLive('datasets', Names.datasets, 1000);
      console.log(datasets);
      await this.save(Names.datasets, datasets);
      dataset = datasetFilename(selected ? selected : datasets[0]);

      console.log(`get revision live ${dataset}`);
      revision = await getLive(dataset, Names.revision, 1000);
      console.log(`Live revision is ${JSON.stringify(revision)}`);

      // Check the current revision
      const id = this.getId(dataset, Names.revision);
      const currentRevision: Revision = await this.get(id, { revision: 0 });
      console.log(`Current revision is ${JSON.stringify(currentRevision)}`);

      if (revision && currentRevision && currentRevision.revision !== null && revision.revision === currentRevision.revision) {
        console.log(`Will not download data for ${dataset} as it is already at revision ${currentRevision.revision}`);
        this.rememberLastDownload();
        return;
      }
    } catch (err) {
      console.log('Possible CORs error as document location is ', document.location.href);
      console.error('Unable to download', err);
      return;
    }

    const events = await getLive(dataset, Names.events);
    const art = await getLive(dataset, Names.art);
    const camps = await getLive(dataset, Names.camps);
    const rsl = await getLive(dataset, Names.rsl);    
    const pins = await getLive(dataset, Names.pins);    
    const links = await getLive(dataset, Names.links);    
    const mapData = await getLiveBinary(dataset, Names.map, 'svg');
    if (this.badData(events, art, camps)) {
      console.error(`Download failed`);
      return;
    }
    console.log('saving data...');
    await this.save(this.getId(dataset, Names.events), events);
    await this.save(this.getId(dataset, Names.camps), camps);
    await this.save(this.getId(dataset, Names.art), art);
    await this.save(this.getId(dataset, Names.rsl), rsl);
    await this.save(this.getId(dataset, Names.pins), pins);
    await this.save(this.getId(dataset, Names.links), links);
    let uri = await this.saveBinary(this.getId(dataset, Names.map), 'svg', mapData);
    await this.save(this.getId(dataset, Names.revision), revision);
    if (uri.startsWith('/DATA/')) {
      uri = `https://data.dust.events/${dataset}/map.svg`;
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
    if (Capacitor.getPlatform() == 'web') {
      return `https://data.dust.events/${dataset}/${name}.${ext ? ext : 'json'}`;
    }
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
    console.log(`Saved ${id} count=${data.length}`);
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
