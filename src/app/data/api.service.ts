import { Injectable } from '@angular/core';
import { Art, Camp, Dataset, MapData, Revision } from './models';

import { SettingsService } from './settings.service';
import { data_dust_events, now, static_dust_events } from '../utils/utils';
import { DbService } from './db.service';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { environment } from 'src/environments/environment';

enum Names {
  festivals = 'festivals', // Get from the root path at https://data.dust.events/  
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
      const revision: Revision = await this.dbService.get(ds, Names.revision, { onlyRead: true });
      if (!revision) {
        console.warn(`Read from app storage`);
        return false;
      }
      const mapData: MapData = await this.dbService.get(ds, Names.map, { onlyRead: true, defaultValue: { filename: '', uri: ''} });
      const mapUri = mapData.uri;
      const exists = await this.dbService.stat(mapUri);
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
    const events = this.dbService.livePath(ds, Names.events);
    const art = this.dbService.livePath(ds, Names.art);
    const camps = this.dbService.livePath(ds, Names.camps);
    const pins = this.dbService.livePath(ds, Names.pins);
    const links = this.dbService.livePath(ds, Names.links);
    const rsl = this.dbService.livePath(ds, Names.rsl);

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

  // private async read(dataset: string, name: Names): Promise<any> {
  //   try {
  //     return await this.dbService.get(dataset, name, { onlyRead: true });
  //   } catch (err) {
  //     console.error(`Failed to read ${dataset} ${name} returning []`);
  //     return [];
  //   }
  // }

  private badData(events: Event[], art: Art[], camps: Camp[]): boolean {
    return !camps || camps.length == 0 || !art || !events || events.length == 0;
  }

  public async loadDatasets(): Promise<Dataset[]> {
    const datasets = await this.dbService.get(Names.datasets, Names.datasets, { timeout: 5000 });
    const festivals = await this.dbService.get(Names.festivals, Names.festivals, { timeout: 5000 });
    return this.cleanNames([...festivals, ...datasets]);
  }

  private cleanNames(datasets: Dataset[]): Dataset[] {
    for (const dataset of datasets) {
      if (dataset.imageUrl.includes('[@static]')) {
        dataset.imageUrl = dataset.imageUrl.replace('[@static]', static_dust_events);
      } else {
        dataset.imageUrl = `${data_dust_events}${dataset.imageUrl}`;
      }
    }
    return datasets;
  }

  private async getVersion(): Promise<string> {
    if (Capacitor.getPlatform() == 'web') return `1.0.0.0`;
    const result = await App.getInfo();
    return `${result.version}.${result.build}`;
  }

  public datasetId(dataset: Dataset): string {
    if (dataset.name == 'TTITD') {
      return `${dataset.name.toLowerCase()}-${dataset.year.toLowerCase()}`;
    } else {
      return `${dataset.name.toLowerCase()}`;
    }
  }

  public async download(selected: Dataset | undefined, force: boolean): Promise<boolean> {
    //const lastDownload = this.settingsService.getLastDownload();
    //const mins = minutesBetween(now(), lastDownload);
    let dataset = '';
    let revision: Revision = { revision: 0 };
    // if (mins < 5) {
    //   console.log(`Downloaded ${mins} minutes ago (${lastDownload})`);
    //   return;
    // }
    try {
      // Gets it from netlify      
      const datasets: Dataset[] = await this.dbService.get(Names.datasets, Names.datasets, { timeout: 1000 });
      const rootDatasets: Dataset[] = await this.dbService.get(Names.festivals, Names.festivals, { timeout: 1000 });
      dataset = this.datasetId(selected ? selected : datasets[0]);

      console.log(`get revision live ${dataset}`);
      revision = await this.dbService.get(dataset, Names.revision, { timeout: 1000 });
      console.log(`Live revision is ${JSON.stringify(revision)}`);

      // Check the current revision
      const currentRevision: Revision = await this.dbService.get(dataset, Names.revision, { onlyRead: true, defaultValue: { revision: 0 } });
      const version: Version = await this.dbService.get(dataset, Names.version, { onlyRead: true, defaultValue: { version: '' } });
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
        return true;
      }
    } catch (err) {
      console.log('Possible CORs error as document location is ', document.location.href);
      console.error('Unable to download', err);
      return false;
    }
    const currentVersion = await this.getVersion();

    const [rEvents, rArt, rCamps, rMusic, rPins, rLinks, rMap] = await Promise.allSettled([
      this.dbService.get(dataset, Names.events, { defaultValue: '' }),
      this.dbService.get(dataset, Names.art, { defaultValue: '' }),
      this.dbService.get(dataset, Names.camps, { defaultValue: '' }),
      this.dbService.get(dataset, Names.pins, { defaultValue: '' }),
      this.dbService.get(dataset, Names.links, { defaultValue: '' }),
      this.dbService.get(dataset, Names.rsl, { defaultValue: '' }),
      this.dbService.get(dataset, Names.map, { defaultValue: '' })
    ]);

    const events = rEvents.status == 'fulfilled' ? rEvents.value : '';
    const art = rArt.status == 'fulfilled' ? rArt.value : '';
    const camps = rCamps.status == 'fulfilled' ? rCamps.value : '';
    const map = rMap.status == 'fulfilled' ? rMap.value : '';

    if (this.badData(events, art, camps)) {
      console.error(`Download failed`);
      return false;
    } else {
      console.log(`Data passed checks for events, art and camps`);
    }

    let uri: string | undefined = undefined;


    if (map) {
      console.log(map);
      const ext = map.filename ? map.filename.split('.').pop() : 'svg';
      const mapData = await this.dbService.getLiveBinary(dataset, Names.map, ext, currentVersion);
      if (mapData) {
        uri = await this.dbService.saveBinary(dataset, Names.map, ext, mapData);
        console.log(`Map saved to ${uri}`);
      }
    }
    await this.dbService.writeData(dataset, Names.revision, revision);
    await this.dbService.writeData(dataset, Names.version, { version: await this.getVersion() });
    if (uri?.startsWith('/DATA/')) {
      uri = `${data_dust_events}${dataset}/map.svg`;
    }
    console.log('map data was set to ' + uri);
    map.uri = uri;
    await this.dbService.writeData(dataset, Names.map, map);

    this.rememberLastDownload();
    return true;
  }

  private rememberLastDownload() {
    this.settingsService.settings.lastDownload = now().toISOString();
    this.settingsService.save();
  }

  // private getId(dataset: string, name: string): string {
  //   return `${dataset}-${name}`;
  // }

  // private async getUri(dataset: string, name: string, ext?: string): Promise<string> {
  //   if (Capacitor.getPlatform() == 'web') {
  //     const host = (dataset.includes('ttitd')) ?
  //       static_dust_events :
  //       data_dust_events;

  //     return `${host}${dataset}/${name}.${ext ? ext : 'json'}`;
  //   }
  //   const r = await Filesystem.getUri({
  //     path: `${this.getId(dataset, name)}.${ext ? ext : 'json'}`,
  //     directory: Directory.Data,
  //   });
  //   return Capacitor.convertFileSrc(r.uri);
  // }

  // private async save(id: string, data: any) {
  //   const res = await Filesystem.writeFile({
  //     path: `${id}.json`,
  //     data: JSON.stringify(data),
  //     directory: Directory.Data,
  //     encoding: Encoding.UTF8,
  //   });
  //   const uri = Capacitor.convertFileSrc(res.uri);
  //   if (data.length) {
  //     console.log(`Saved ${uri} length=${data.length}`);
  //   } else {
  //     console.log(`Saved ${uri} data=${JSON.stringify(data)}`);
  //   }
  // }


}
