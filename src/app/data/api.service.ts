import { Injectable } from '@angular/core';
import { Art, Camp, Dataset, Revision } from './models';
import { datasetFilename, getCached, getLive, getLiveBinary } from './api';
import { SettingsService } from './settings.service';
import { now } from '../utils/utils';
import { DbService } from './db.service';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { environment } from 'src/environments/environment';

enum Names {
  datasets = 'datasets',
  events = 'events',
  art = 'art',
  camps = 'camps',
  rsl = 'rsl',
  revision = 'revision',
  version = 'version',
  pins = 'pins',
  links = 'links',
  map = 'map',
}

interface Version {
  version: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(
    private settingsService: SettingsService,
    private dbService: DbService,
  ) { }

  public async sendDataToWorker(
    defaultRevision: number,
    hideLocations: boolean,
    mapIsOffline: boolean,
  ): Promise<boolean> {
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
      console.info(`Saved settings`);
      if (revision.revision <= defaultRevision && mapIsOffline) {
        console.warn(
          `Did not read data from storage as it is at revision ${revision.revision} but current is ${defaultRevision}`,
        );
        return true;
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

    const datasetInfo = {
      dataset: ds,
      events,
      camps,
      art,
      pins,
      links,
      rsl,
      hideLocations,
    };
    if (!environment.production) {
      console.warn(`Using non-production: ${JSON.stringify(environment)}`);
    }
    console.info(`dbService.setDataset ${JSON.stringify(datasetInfo)}...`);
    const result = await this.dbService.setDataset(datasetInfo);
    await this.reportWorkerLogs();
    if (!result || (result.events == 0 && result.camps == 0 && result.pins == 0)) {
      console.error(`dbService.setDataset complete but bad data ${JSON.stringify(result)}`);

      return false;
    }
    console.info(`dbService.setDataset complete ${JSON.stringify(result)}`);
    return true;
  }

  private async reportWorkerLogs() {
    await this.dbService.getWorkerLogs();
  }

  private async read(dataset: string, name: Names): Promise<any> {
    return await this.get(this.getId(dataset, name), []);
  }

  private badData(events: Event[], art: Art[], camps: Camp[]): boolean {
    return !camps || camps.length == 0 || !art || !events || events.length == 0;
  }

  public async loadDatasets(): Promise<Dataset[]> {
    return this.cleanNames(await getCached(Names.datasets, Names.datasets, 5000));
  }

  private cleanNames(datasets: Dataset[]): Dataset[] {
    for (const dataset of datasets) {
      if (dataset.name == 'TTITD') {
        switch (dataset.year) {
          case '2023': dataset.title = 'Animalia 2023'; break;
          case '2022': dataset.title = 'Walking Dreams 2022'; break;
          case '2019': dataset.title = 'Metamorphosis 2019'; break;
          case '2018': dataset.title = 'I, Robot 2018'; break;
          case '2017': dataset.title = 'Radical Ritual 2017'; break;
        }
      }
    }
    return datasets;
  }

  private async getVersion(): Promise<string> {
    const result = await App.getInfo();
    return `${result.version}.${result.build}`;
  }

  public async download(selected: Dataset | undefined, force?: boolean) {
    //const lastDownload = this.settingsService.getLastDownload();
    //const mins = minutesBetween(now(), lastDownload);
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
      const vid = this.getId(dataset, Names.version);
      const currentRevision: Revision = await this.get(id, { revision: 0 });
      const version: Version = await this.get(vid, { version: '' });
      const currentVersion = await this.getVersion();
      console.log(`Current revision is ${JSON.stringify(currentRevision)} force is ${force}`);

      if (
        !force &&
        revision &&
        currentRevision &&
        currentRevision.revision !== null &&
        revision.revision === currentRevision.revision &&
        version?.version == currentVersion
      ) {
        console.log(
          `Will not download data for ${dataset} as it is already at revision ${currentRevision.revision} and version is ${currentVersion}`,
        );
        this.rememberLastDownload();
        return;
      }
    } catch (err) {
      console.log('Possible CORs error as document location is ', document.location.href);
      console.error('Unable to download', err);
      return;
    }

    const currentVersion = await this.getVersion();
    const pEvents = getLive(dataset, Names.events);
    const pArt = getLive(dataset, Names.art);
    const pCamps = getLive(dataset, Names.camps);
    const pRsl = getLive(dataset, Names.rsl);
    const pPins = getLive(dataset, Names.pins);
    const pLinks = getLive(dataset, Names.links);
    const pMapData = getLiveBinary(dataset, Names.map, 'svg', currentVersion);
    const [events, art, camps, rsl, pins, links, mapData] = await Promise.all([
      pEvents,
      pArt,
      pCamps,
      pRsl,
      pPins,
      pLinks,
      pMapData,
    ]);
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
    await this.save(this.getId(dataset, Names.version), { version: await this.getVersion() });
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
      if (dataset.includes('ttitd')) {
        return `assets/${dataset}/${name}.json`;
      } else {
        return `https://data.dust.events/${dataset}/${name}.${ext ? ext : 'json'}`;
      }
    }
    const r = await Filesystem.getUri({
      path: `${this.getId(dataset, name)}.${ext ? ext : 'json'}`,
      directory: Directory.Data,
    });
    return Capacitor.convertFileSrc(r.uri);
  }

  private async stat(dataset: string, name: string, ext?: string): Promise<boolean> {
    try {
      const s = await Filesystem.stat({
        path: `${this.getId(dataset, name)}.${ext ? ext : 'json'}`,
        directory: Directory.Data,
      });
      return s.size > 0;
    } catch {
      return false;
    }
  }

  private async get(id: string, defaultValue: any): Promise<any> {
    try {
      console.log(`Reading ${id}`);
      const contents = await Filesystem.readFile({
        path: `${id}.json`,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      return JSON.parse(contents.data as any);
    } catch (err) {
      console.warn(`Unable to read ${id}. Using ${JSON.stringify(defaultValue)}: ${err}`);
      return defaultValue;
    }
  }

  private async save(id: string, data: any) {
    const res = await Filesystem.writeFile({
      path: `${id}.json`,
      data: JSON.stringify(data),
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
    const uri = Capacitor.convertFileSrc(res.uri);
    if (data.length) {
      console.log(`Saved ${uri} length=${data.length}`);
    } else {
      console.log(`Saved ${uri} data=${JSON.stringify(data)}`);
    }
  }

  private async saveBinary(id: string, ext: string, data: any): Promise<string> {
    const res = await Filesystem.writeFile({
      path: `${id}.${ext}`,
      data: data,
      directory: Directory.Data,
    });
    return Capacitor.convertFileSrc(res.uri);
  }
}
