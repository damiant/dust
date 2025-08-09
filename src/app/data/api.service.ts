import { Injectable, WritableSignal, inject } from '@angular/core';
import {
  Art,
  Camp,
  Dataset,
  DatasetFilter,
  DatasetResult,
  FullDataset,
  LiveLocation,
  LocationHidden,
  MapData,
  Names,
  Revision,
  WebLocation,
} from './models';

import { SettingsService } from './settings.service';
import { asNumber, data_dust_events, daysUntil, diffNumbers, isAfter, nowAtEvent, static_dust_events } from '../utils/utils';
import { DbService, GetOptions } from './db.service';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { environment } from 'src/environments/environment';
import { getCachedImage } from './cache-store';
import { distance } from '../map/map.utils';

export type DownloadResult = 'success' | 'error' | 'already-updated';

interface Version {
  version: string;
}

export interface DownloadStatus {
  status: string;
  firstDownload: boolean; // First time downloading
}

export interface SendResult {
  datasetResult?: DatasetResult;
  success: boolean;
}
@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private settingsService = inject(SettingsService);
  private dbService = inject(DbService);

  public async sendDataToWorker(
    currentRevision: number,
    locationAvailable: LocationHidden,
    mapIsOffline: boolean, // Are we using the built in map.svg
  ): Promise<SendResult> {
    const ds = this.settingsService.settings.datasetId;

    try {
      const revision: Revision = await this.dbService.get(ds, Names.revision, { onlyRead: true });
      if (!revision) {
        console.warn(`Read from app storage`);
        return { success: false };
      }
      const mapData: MapData = await this.dbService.get(ds, Names.map, {
        onlyRead: true,
        defaultValue: { filename: '', uri: '' },
      });
      const mapUri = await getCachedImage(mapData.uri);
      await this.settingsService.setMapURI(mapIsOffline ? '' : mapUri);
      const offlineWeb = environment.offline && Capacitor.getPlatform() === 'web';
      console.log(`Download? revision is ${revision.revision} and default is ${currentRevision}. offlineWeb=${offlineWeb}`);
      if (revision.revision <= currentRevision && !offlineWeb) {
        console.warn(
          `Did not read data from storage as it is at revision ${revision.revision} but current is ${currentRevision}`,
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
    const map = this.dbService.livePath(ds, Names.map);

    const datasetInfo: FullDataset = {
      dataset: ds,
      events,
      camps,
      art,
      pins,
      links,
      rsl,
      map,
      locationAvailable,
      timezone: this.dbService.getTimeZone(),
    };
    if (!environment.production) {
      console.warn(`Using non-production: ${JSON.stringify(environment)}`);
    }
    
    const result = await this.dbService.setDataset(datasetInfo);
    await this.reportWorkerLogs();

    const hasNoData = !result || (result.events == 0 && result.camps == 0 && result.pins == 0);
    const isPreview = !!this.dbService.overrideDataset;
    if (!result || (hasNoData && !isPreview)) {
      console.error(`dbService.setDataset complete but bad data ${JSON.stringify(result)}`);
      console.log(`Bad data. Will redownload`);
      return { success: false };
    }
    return { success: true, datasetResult: result };
  }

  public hasStarted(a: Dataset): boolean {
    // This is whether the event is in the past
    const start = new Date(a.start);
    const until = daysUntil(start, new Date());
    console.log(`There are ${until} days until the event starts`);
    return until <= 0;
  }

  private async reportWorkerLogs() {
    await this.dbService.getWorkerLogs();
  }

  private badData(events: Event[], art: Art[], camps: Camp[]): boolean {
    if (!camps || !art || !events) return true;
    if (camps.length == 0 && art.length == 0 && events.length == 0) return true;
    return false;
  }

  public async loadDatasets(args: { filter: DatasetFilter, inactive?: boolean, cached?: boolean, timeout?: number }): Promise<Dataset[]> {
    const options: GetOptions = args.cached ?
      { onlyRead: true, defaultValue: [] } :
      { freshOnce: true, timeout: args.timeout ?? 5000 };
    const [rDatasets, rFestivals, rLocation] = await Promise.allSettled([
      this.dbService.get(Names.festivals, Names.festivals, options),
      this.dbService.get(Names.datasets, Names.datasets, options),
      this.dbService.get(Names.location, Names.location, options)
    ]);
    const location: WebLocation = rLocation.status == 'fulfilled' ? rLocation.value : {};
    const festivals = rFestivals.status == 'fulfilled' ? rFestivals.value : [];
    const datasets = rDatasets.status == 'fulfilled' ? rDatasets.value : [];
    const devMode = await this.settingsService.getInteger('developermode');    
    return this.cleanNames([...festivals, ...datasets], location, args.filter, args.inactive, devMode === 1);
  }

  private cleanNames(datasets: Dataset[], location: WebLocation, filter: DatasetFilter, inactive?: boolean, devMode?: boolean): Dataset[] {
    
    for (const dataset of datasets) {
      if (devMode && dataset.id == 'eforest-draft') {
        dataset.active = true;
      }
      if (dataset.id.includes('ttitd')) {
        dataset.rssFeed = 'https://journal.burningman.org/feed/';
      }
      if (dataset.imageUrl?.includes('[@static]')) {
        dataset.imageUrl = dataset.imageUrl.replace('[@static]', static_dust_events);
        dataset.active = true;
      } else {
        if (dataset.imageUrl) {
          if (!dataset.imageUrl.startsWith(data_dust_events)) {
            dataset.imageUrl = `${data_dust_events}${dataset.imageUrl}`;
          }
        } else {
          dataset.imageUrl = '';
        }
      }
      dataset.dist = distance(
        { lat: dataset.lat, lng: dataset.long },
        { lat: asNumber(location?.latitude, 0), lng: asNumber(location?.longitude, 0) },
      );
      const daysTilStart = daysUntil(new Date(dataset.start), nowAtEvent(dataset.timeZone));
      const hasEnded = daysUntil(new Date(dataset.end), nowAtEvent(dataset.timeZone)) < 0;
      dataset.subTitle = `${daysTilStart} day${daysTilStart == 1 ? '' : 's'} until ${dataset.title}`;
      if (hasEnded) {
        dataset.subTitle = ``;
      } else if (daysTilStart <= 0) {
        dataset.subTitle = `${dataset.title} is happening now`;
      }
    }

    const list = datasets
      .filter((d) => d.active || inactive)
      .filter((d) => this.byType(d, filter))
      .sort((a, b) => this.sortEvents(a, b, filter));
    if (list.length > 1 && filter == 'all' && isAfter(new Date(list[0].start), new Date(list[1].start))) {
      // Make Burning Man first if the closest regional is after it.
      if (list[1].id.includes('ttitd')) {
        const tmp = { ...list[0] };
        list[0] = list[1];
        list[1] = tmp;
      }
    }
    return list;
  }

  private sortEvents(a: Dataset, b: Dataset, filter: DatasetFilter): number {
    const diff = diffNumbers(a.dist, b.dist);
    if (filter === 'all') {
      if (a.id.toLowerCase().startsWith('ttitd')) {
        return -1;
      }
      if (b.id.toLowerCase().startsWith('ttitd')) {
        return 1;
      }
    }

    return diff;
  }

  private byType(a: Dataset, filter: DatasetFilter): boolean {
    const isPast = this.isPast(a);
    switch (filter) {
      case 'bm':
        return a.id.startsWith('ttitd');
      case 'past':
        return isPast;
      case 'regional':
        return !isPast && !a.id.startsWith('ttitd');
      default:
        return !isPast;
    }
  }

  private isPast(a: Dataset): boolean {
    // This is whether the event is in the past
    const end = new Date(a.end);
    const until = daysUntil(end, new Date());
    return until < -7; // 1 week grace period until we consider it past
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

  public async getLiveLocations(): Promise<LiveLocation[]> {
    const ds = this.settingsService.settings.datasetId;
    const s = Date.now() / 30000; // Changes every 30 seconds to give Cloudflare a chance to cache
    const liveUrl = this.dbService.livePath(ds, Names.live) + `?${s}`;
    try {
      const res = await fetch(liveUrl, { method: 'GET', cache: 'no-cache' });
      return await res.json();
    } catch (err) {
      console.error(`Failed to get live locations`, err);
      return [];
    }
  }

  public async registerToken(token: string, dataset: string): Promise<boolean> {
    const payload = { token, festival: dataset };
    const res = await fetch(`https://api.dust.events/pushtokens`, { method: 'POST', body: JSON.stringify(payload) });
    return res.status == 200;
  }

  public async unregisterToken(token: string, dataset: string): Promise<boolean> {
    const payload = { token, festival: dataset };
    const res = await fetch(`https://api.dust.events/pushtokens`, { method: 'DELETE', body: JSON.stringify(payload) });
    return res.status == 200;
  }

  public async hasEverDownloaded(selected: Dataset) {
    const dataset = this.datasetId(selected);
    const myRevision = this.checkUndefined(await this.dbService.get(dataset, Names.revision, { onlyRead: true, defaultValue: { revision: 0 } }));
    return (myRevision && myRevision > 0);
  }

  private checkUndefined(v: any): any {    
    if (`${JSON.stringify(v)}` === '[]') {
      return undefined;
    }
    return v;
  }

  public async getRevision(datasetId: string): Promise<Revision | undefined> {
    return this.checkUndefined(await this.dbService.get(datasetId, Names.revision, { onlyRead: true, defaultValue: { revision: 0 } }));
  }

  public async download(
    selected: Dataset | undefined,
    force: boolean,
    downloadSignal: WritableSignal<DownloadStatus>,
  ): Promise<DownloadResult> {
    let dataset = '';
    let nextRevision: Revision | undefined;
    let myRevision: Revision | undefined;
    try {
      // Gets it from netlify
      const datasets: Dataset[] = await this.dbService.get(Names.datasets, Names.datasets, {
        freshOnce: true,
        timeout: 1000,
      });
      if (!selected) {
        selected = datasets[0];
      }
      dataset = this.datasetId(selected);

      console.log(`get revision live ${dataset}`);
      myRevision = this.checkUndefined(await this.dbService.get(dataset, Names.revision, { onlyRead: true, defaultValue: { revision: 0 } }));
      if (!myRevision) {        
        downloadSignal.set({ status: selected ? selected.title : ' ', firstDownload: true });      
      }
      nextRevision = this.checkUndefined(await this.dbService.get(dataset, Names.revision, {
        onlyFresh: true,
        timeout: myRevision ? 2000 : 60000, // 1 Minute to download if we have never downloaded
        defaultValue: { revision: 0 },
      }));
      console.log(`Next revision is ${JSON.stringify(nextRevision)} force is ${force}`);
      
      console.log(`My revision is ${JSON.stringify(myRevision)}`);

      // Check the current revision
      const version: Version = await this.dbService.get(dataset, Names.version, {
        onlyRead: true,
        defaultValue: { version: '' },
      });
      const currentVersion = await this.getVersion();

      console.info(
        `${dataset}: force=${force} revision=${JSON.stringify(myRevision)} currentRevision=${JSON.stringify(nextRevision)}`,
      );

      if (
        !force &&
        myRevision &&
        nextRevision &&
        nextRevision.revision !== null &&
        myRevision?.revision === nextRevision.revision &&
        version?.version == currentVersion
      ) {
        console.log(
          `Will not download data for ${dataset} as it is already at revision ${nextRevision.revision} and version is ${currentVersion}`,
        );
        return 'already-updated';
      }
    } catch (err) {
      console.log('Possible CORs error as document location is ', document.location.href);
      console.error('Unable to download', err);
      return 'error';
    }
    console.log(`Will attempt download to ${JSON.stringify(nextRevision)}`);
    if (!nextRevision) return 'error';

    downloadSignal.set({ status: selected ? selected.title : ' ', firstDownload: myRevision === undefined });
    const currentVersion = await this.getVersion();
    const revision: Revision = nextRevision;
    const [rEvents, rArt, rCamps, rPins, rLinks, rRSL, rMap, rGeo, rRestrooms, rIce, rMedical] =
      await Promise.allSettled([
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
    console.log(
      `events=${rEvents.status} art=${rArt.status} camps=${rCamps.status} pins=${rPins.status} links=${rLinks.status} map=${rMap.status} geo=${rGeo.status} restrooms=${rRestrooms.status} ice=${rIce.status} medical=${rMedical.status} rsl=${rRSL.status}`,
    );
    let uri: string | undefined = undefined;
    if (map) {
      const ext = map.filename ? map.filename.split('.').pop() : 'svg';
      if (map.filename) {
        console.info(`download.map ${map.filename} ext=${ext}`);
        uri = await this.dbService.getLiveBinary(dataset, map.filename, currentVersion);
        console.info(`download.map uri=${uri}`);
        downloadSignal.set({ status: `${selected.title}  Map`, firstDownload: myRevision === undefined });
        uri = await getCachedImage(uri);
        console.info(`download.map completed`);
      }
    }

    if (this.badData(events, art, camps)) {
      console.error(`Download has no events, art or camps and has failed.`);
      downloadSignal.set({ status: '', firstDownload: false });
      return 'error';
    } else {
      console.log(`Data passed checks for events, art and camps`);
    }

    await this.dbService.writeData(dataset, Names.revision, revision);
    await this.dbService.writeData(dataset, Names.version, { version: await this.getVersion() });
    map.uri = uri;
    await this.dbService.writeData(dataset, Names.map, map);

    downloadSignal.set({ status: '', firstDownload: false });
    return 'success';
  }
}
