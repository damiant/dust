import { Injectable, WritableSignal } from '@angular/core';
import { Art, Camp, Dataset, DatasetResult, MapData, Names, Revision } from './models';

import { SettingsService } from './settings.service';
import { data_dust_events, static_dust_events } from '../utils/utils';
import { DbService } from './db.service';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { environment } from 'src/environments/environment';
import { getCachedImage } from './cache-store';

interface Version {
  version: string;
}

export interface SendResult {
  datasetResult?: DatasetResult,
  success: boolean;
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
    mapIsOffline: boolean, // Are we using the built in map.svg
  ): Promise<SendResult> {
    const ds = this.settingsService.settings.datasetId;

    try {
      const revision: Revision = await this.dbService.get(ds, Names.revision, { onlyRead: true });
      if (!revision) {
        console.warn(`Read from app storage`);
        return { success: false };
      }
      const mapData: MapData = await this.dbService.get(ds, Names.map, { onlyRead: true, defaultValue: { filename: '', uri: '' } });
      const mapUri = mapData.uri;
      this.settingsService.settings.mapUri = mapIsOffline ? '' : mapUri;
      this.settingsService.save();
      console.log(`Download? revision is ${revision.revision} and default is ${defaultRevision}`);
      if (revision.revision <= defaultRevision) {
        console.warn(
          `Did not read data from storage as it is at revision ${revision.revision} but current is ${defaultRevision}`,
        );
        return { success: true };
      }
    } catch (err) {
      console.error(`Unable read revision`, err);
      return { success: false };
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
      console.log(`Bad data. Will redownload`)
      return { success: false };
    }
    console.info(`dbService.setDataset complete ${JSON.stringify(result)}`);
    return { success: false, datasetResult: result };
  }

  private async reportWorkerLogs() {
    await this.dbService.getWorkerLogs();
  }

  private badData(events: Event[], art: Art[], camps: Camp[]): boolean {
    return !camps || camps.length == 0 || !art || !events || events.length == 0;
  }

  public async loadDatasets(): Promise<Dataset[]> {
    const datasets = await this.dbService.get(Names.datasets, Names.datasets, { freshOnce: true, timeout: 5000 });
    const festivals = await this.dbService.get(Names.festivals, Names.festivals, { freshOnce: true, timeout: 5000 });
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

  public async download(selected: Dataset | undefined, force: boolean, downloadSignal: WritableSignal<boolean>): Promise<boolean> {
    let dataset = '';
    let revision: Revision = { revision: 0 };
    try {
      // Gets it from netlify      
      const datasets: Dataset[] = await this.dbService.get(Names.datasets, Names.datasets, { freshOnce: true, timeout: 1000 });
      dataset = this.datasetId(selected ? selected : datasets[0]);

      console.log(`get revision live ${dataset}`);
      const currentRevision: Revision = await this.dbService.get(dataset, Names.revision, { onlyRead: true, defaultValue: { revision: 0 } });
      console.log(`Current revision is ${JSON.stringify(currentRevision)} force is ${force}`);
      console.log(`Live revision is ${JSON.stringify(revision)}`);

      // Check the current revision
      const version: Version = await this.dbService.get(dataset, Names.version, { onlyRead: true, defaultValue: { version: '' } });
      const currentVersion = await this.getVersion();

      console.log(`force=${force} revision=${JSON.stringify(revision)} currentRevision=${JSON.stringify(currentRevision)}`)

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
        return true;
      }
    } catch (err) {
      console.log('Possible CORs error as document location is ', document.location.href);
      console.error('Unable to download', err);
      return false;
    }

    downloadSignal.set(true);
    const currentVersion = await this.getVersion();

    const [rEvents, rArt, rCamps, rPins, rLinks, rRSL, rMap, rGeo, rRestrooms, rIce, rMedical] = await Promise.allSettled([
      this.dbService.get(dataset, Names.events, { revision: revision.revision, defaultValue: '' }),
      this.dbService.get(dataset, Names.art, { revision: revision.revision, defaultValue: '' }),
      this.dbService.get(dataset, Names.camps, { revision: revision.revision, defaultValue: '' }),
      this.dbService.get(dataset, Names.pins, { revision: revision.revision, defaultValue: '' }),
      this.dbService.get(dataset, Names.links, { revision: revision.revision, defaultValue: '' }),
      this.dbService.get(dataset, Names.rsl, { revision: revision.revision, defaultValue: '' }),
      this.dbService.get(dataset, Names.map, { revision: revision.revision, defaultValue: '' }),
      this.dbService.get(dataset, Names.geo, { revision: revision.revision, defaultValue: '' }),
      this.dbService.get(dataset, Names.restrooms, { revision: revision.revision, defaultValue: '' }),
      this.dbService.get(dataset, Names.ice, { revision: revision.revision, defaultValue: '' }),
      this.dbService.get(dataset, Names.medical, { revision: revision.revision, defaultValue: '' }),
    ]);

    const events = rEvents.status == 'fulfilled' ? rEvents.value : '';
    const art: Art[] = rArt.status == 'fulfilled' ? rArt.value : '';
    const camps = rCamps.status == 'fulfilled' ? rCamps.value : '';
    const map = rMap.status == 'fulfilled' ? rMap.value : '';
    console.log(`events=${rEvents.status} art=${rArt.status} camps=${rCamps.status} pins=${rPins.status} links=${rLinks.status} map=${rMap.status} geo=${rGeo.status} restrooms=${rRestrooms.status} ice=${rIce.status} medical=${rMedical.status} rsl=${rRSL.status}`);

    if (this.badData(events, art, camps)) {
      console.error(`Download failed`);
      downloadSignal.set(false);
      return false;
    } else {
      console.log(`Data passed checks for events, art and camps`);
    }
    let uri: string | undefined = undefined;


    if (map) {
      console.log(map);
      const ext = map.filename ? map.filename.split('.').pop() : 'svg';
      uri = await this.dbService.getLiveBinary(dataset, Names.map, ext, currentVersion);
      uri = await getCachedImage(uri);
    }
    await this.dbService.writeData(dataset, Names.revision, revision);
    await this.dbService.writeData(dataset, Names.version, { version: await this.getVersion() });
    console.log('map data was set to ' + uri);
    map.uri = uri;
    await this.dbService.writeData(dataset, Names.map, map);

    downloadSignal.set(false);
    return true;
  }
}
