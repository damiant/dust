import { Injectable, WritableSignal, computed, signal } from '@angular/core';
import {
  Event,
  Day,
  Camp,
  Art,
  DataMethods,
  MapSet,
  GeoRef,
  RSLEvent,
  TimeRange,
  MapPoint,
  FullDataset,
  Link,
  DatasetResult,
  Dataset,
  Names,
} from './models';
import { call, registerWorker } from './worker-interface';
import { BurningManTimeZone, clone, data_dust_events, daysUntil, noDate, now, nowAtEvent, static_dust_events } from '../utils/utils';
import { GpsCoord, Point } from '../map/geo.utils';
import { environment } from 'src/environments/environment';
import { Network } from '@capacitor/network';
import { Directory, Filesystem } from '@capacitor/filesystem';



export interface GetOptions {
  timeout?: number; // Timeout when reading live
  onlyRead?: boolean; // Just read from cache, do not attempt to download
  defaultValue?: any; // Return default value on failure
  freshOnce?: boolean; // Download once then onlyRead afterwards
  onlyFresh?: boolean; // Download it fresh and dont cache
  revision?: number; // This is used for cache busting
}

@Injectable({
  providedIn: 'root',
})
export class DbService {
  private defaultDataset: Dataset = { name: '', year: '', id: '', title: '', start: '', end: '', subTitle: '', lat: 0, long: 0, mapDirection: 0, imageUrl: '', timeZone: '', active: false };
  public selectedDay = signal(noDate());
  public selectedYear = signal('');
  public selectedDataset = signal(this.defaultDataset);
  public selectedImage = computed(() => { const r = `${this.selectedDataset().imageUrl}`; console.info(r); return r });
  public featuresHidden = signal(['']);
  public networkStatus = signal('');
  public resume = signal('');
  public restart: WritableSignal<string> = signal('');
  private initialized = false;
  private hideLocations = true;
  private prefix = '';
  public overrideDataset: string | undefined;
  private datasetsRead: string[] = [];
  private worker!: Worker;

  public async initWorker(): Promise<void> {
    if (!this.initialized) {
      this.overrideDataset = this.getPreview();
      console.info(`Initializing web worker...`);
      this.worker = new Worker(new URL('./app.worker', import.meta.url));
      registerWorker(this.worker);
      console.info(`Initialized web worker`);
      this.initialized = true;
    }
  }

  public getPreview(): string | undefined {
    const params = new URLSearchParams(document.location.search);
    const value = params.get('preview');
    if (value !== null) {
      console.info(`Switching to preview ${value}`);
      this.prefix = 'preview-';
      return value;
    }
    return undefined;
  }

  public getTimeZone(): string {
    let timezone = this.selectedDataset().timeZone;
    if (!timezone) {
      timezone = BurningManTimeZone;
      console.error(`Shouldnt get an empty timezone`);
    }
    return timezone;
  }

  public async populate(dataset: string, timezone: string): Promise<DatasetResult> {
    this.initWorker(); // Just to double check
    const result: DatasetResult = await call(this.worker, DataMethods.Populate, dataset, this.hideLocations, environment, timezone);
    await this.writeData(dataset, Names.summary, result)
    return result;
  }

  public isHistorical(): boolean {
    // This is whether the event is in the past
    const end = new Date(this.selectedDataset().end);
    const until = daysUntil(end, nowAtEvent(this.getTimeZone()));
    return (until < 0);
  }

  public eventHasntBegun(): boolean {
    // This is whether the event has not started yet
    const start = new Date(this.selectedDataset().start);
    const until = daysUntil(start, now());
    return (until > 0);
  }

  public checkInit() {
    if (!this.initialized) {
      document.location.href = '';
    } else {
      if (this.selectedDataset().name == '') {
        // Restart if we dont have data
        this.restart.set(Math.random().toString());
      }
    }
  }

  public setHideLocations(hide: boolean) {
    this.hideLocations = hide;
  }

  public locationsHidden(): boolean {
    return this.hideLocations;
  }

  public async checkEvents(day?: Date): Promise<void> {
    return await call(this.worker, DataMethods.CheckEvents, day);
  }

  public async findEvents(
    query: string,
    day: Date | undefined,
    category: string,
    coords: GpsCoord | undefined,
    timeRange: TimeRange | undefined,
    allDay: boolean,
  ): Promise<Event[]> {
    return await call(this.worker, DataMethods.FindEvents, query, day, category, coords, timeRange, allDay);
  }

  public async getEventList(ids: string[]): Promise<Event[]> {
    return await call(this.worker, DataMethods.GetEventList, ids);
  }

  public async getRSLEvents(ids: string[]): Promise<RSLEvent[]> {
    return await call(this.worker, DataMethods.GetRSLEventList, ids, this.isHistorical());
  }

  public async getGeoReferences(): Promise<GeoRef[]> {
    return await call(this.worker, DataMethods.GetGeoReferences);
  }

  public async gpsToPoint(gpsCoord: GpsCoord): Promise<Point> {
    return await call(this.worker, DataMethods.GpsToPoint, gpsCoord);
  }

  public async getWorkerLogs(): Promise<void> {
    const logs = await call(this.worker, DataMethods.ConsoleLog);
    for (const log of logs) {
      if (log.startsWith('[error]')) {
        console.error(`[worker]${log.replace('[error]', '')}`);
      } else {
        console.info('[worker]', log);
      }
    }
    if (logs.length == 0) {
      console.info('[worker] no worker logs')
    }
  }

  public async gpsToMapPoint(gpsCoord: GpsCoord, title: string | undefined): Promise<MapPoint> {
    const point = await this.gpsToPoint(gpsCoord);
    return {
      street: '',
      clock: '',
      x: point.x,
      y: point.y,
      gps: clone(gpsCoord),
      info: title ? { title, location: '', subtitle: '' } : undefined,
    };
  }

  public async getMapPoints(name: string): Promise<MapSet> {
    return await call(this.worker, DataMethods.GetMapPoints, name);
  }

  private async _read(key: string): Promise<any> {
    return await call(this.worker, DataMethods.ReadData, key);
  }

  public async get(dataset: string, name: Names, options: GetOptions): Promise<any> {
    // TODO: Move this to a signal that responds to network change to improve perf
    const status = await Network.getStatus();
    try {
      let onlyRead = !!options.onlyRead;
      if (options.freshOnce) {
        if (this.haveRead(this._getkey(dataset, name))) {
          onlyRead = true;
        }
      }
      if (!status.connected) {
        onlyRead = true;
      }
      if (onlyRead) {
        return await this._read(this._getkey(dataset, name));
      } else {
        let url = this.livePath(dataset, name);
        if (options.revision) {
          url += `?revision=${options.revision}`;

        }
        if (!!options.onlyFresh) {
          return await this.fetch(this._getkey(dataset, name), url, options.timeout ?? 30000);
        }

        const result = await this._write(this._getkey(dataset, name), url, options.timeout ?? 30000);
        this.markRead(this._getkey(dataset, name));
        return result;
      }
    } catch (err) {
      const error = `Failed to get dataset=${dataset} name=${name}`;
      if (options.defaultValue) {
        console.warn(`${error}. Return default vaule of ${options.defaultValue}`);
        return options.defaultValue;
      } else {
        throw new Error(error);
      }
    }
  }

  private haveRead(key: string) {
    return this.datasetsRead.includes(key);
  }
  private markRead(key: string) {
    if (!this.datasetsRead.includes(key)) {
      this.datasetsRead.push(key);
    }
  }

  public async writeData(dataset: string, name: string, data: any): Promise<void> {
    this._writeData(this._getkey(dataset, name), data);
  }

  private _getkey(dataset: string, name: string): string {
    return `${dataset}-${name}`
  }

  private async _write(key: string, url: string, timeout = 30000): Promise<any> {
    return await call(this.worker, DataMethods.Write, key, url, timeout);
  }

  private async fetch(key: string, url: string, timeout = 30000): Promise<any> {
    return await call(this.worker, DataMethods.Fetch, key, url, timeout);
  }

  private async _writeData(key: string, data: any): Promise<any> {
    return await call(this.worker, DataMethods.WriteData, key, data);
  }

  private async clearIDB(): Promise<any> {
    return await call(this.worker, DataMethods.Clear);
  }

  public async clear() {
    try {
      const d = await Filesystem.readdir({ path: '.', directory: Directory.Cache });
      for (let file of d.files) {
        console.log(`Delete file ${file.name}`);
        await Filesystem.deleteFile({ path: file.name, directory: Directory.Cache });
      }
    } catch (err) {
      console.error(`Failed to clear Directory.Cache`, err);
    }
    try {
      await this.clearIDB();
    } catch (err) {
      console.error(`Failed to clear IDB`, err);
    }
  }

  public async getPins(name: string): Promise<MapSet> {
    return await call(this.worker, DataMethods.GetPins, name);
  }

  public async getGPSPoints(name: string, title: string): Promise<MapSet> {
    return await call(this.worker, DataMethods.GetGPSPoints, name, title);
  }

  public async getRSL(terms: string, day: Date | undefined, gpsCoord: GpsCoord | undefined): Promise<RSLEvent[]> {
    const r = await call(this.worker, DataMethods.GetRSLEvents, terms, day, gpsCoord, this.isHistorical());
    this.getWorkerLogs();
    return r;
  }

  public async searchRSL(terms: string, isHistorical: boolean): Promise<Day[]> {
    return await call(this.worker, DataMethods.SearchRSLEvents, terms, isHistorical);
  }

  public async getCategories(): Promise<string[]> {
    return await call(this.worker, DataMethods.GetCategories);
  }

  public async getCampList(ids: string[]): Promise<Camp[]> {
    return await call(this.worker, DataMethods.GetCampList, ids);
  }

  public async getArtList(ids: string[]): Promise<Art[]> {
    return await call(this.worker, DataMethods.GetArtList, ids);
  }

  public async findCamps(query: string, near?: GpsCoord): Promise<Camp[]> {
    return await call(this.worker, DataMethods.FindCamps, query, near);
  }

  public async findArts(query: string | undefined, coords: GpsCoord | undefined): Promise<Art[]> {
    return await call(this.worker, DataMethods.FindArts, query, coords);
  }

  public async findArt(uid: string): Promise<Art> {
    return await call(this.worker, DataMethods.FindArt, uid);
  }

  public async findEvent(uid: string): Promise<Event> {
    return await call(this.worker, DataMethods.FindEvent, uid);
  }

  public async getMapPointGPS(mapPoint: MapPoint): Promise<GpsCoord> {
    return await call(this.worker, DataMethods.GetMapPointGPS, mapPoint);
  }

  public offsetGPS(gpsCoord: GpsCoord): GpsCoord {
    if (environment.latitudeOffset && environment.longitudeOffset) {
      const before = clone(gpsCoord);
      const after = { lat: gpsCoord.lat + environment.latitudeOffset, lng: gpsCoord.lng + environment.longitudeOffset };
      gpsCoord = after;
      console.error(`GPS Position was modified ${JSON.stringify(before)} to ${JSON.stringify(after)}`);
    }
    return gpsCoord;
  }

  public async setMapPointsGPS(mapPoints: MapPoint[]): Promise<MapPoint[]> {
    return await call(this.worker, DataMethods.SetMapPointsGPS, mapPoints);
  }

  public async findCamp(uid: string): Promise<Camp> {
    return await call(this.worker, DataMethods.FindCamp, uid);
  }

  public async getDays(name: Names): Promise<Day[]> {
    return await call(this.worker, DataMethods.GetDays, name);
  }

  public async getEvents(idx: number, count: number): Promise<Event[]> {
    return await call(this.worker, DataMethods.GetEvents, idx, count);
  }

  public async getLinks(): Promise<Link[]> {
    return await call(this.worker, DataMethods.GetLinks);
  }

  public async setDataset(fullDataset: FullDataset): Promise<DatasetResult> {
    return await call(this.worker, DataMethods.SetDataset, fullDataset);
  }

  public async getCampEvents(campId: string): Promise<Event[]> {
    return await call(this.worker, DataMethods.GetCampEvents, campId);
  }

  public async getCampRSLEvents(campId: string): Promise<RSLEvent[]> {
    return await call(this.worker, DataMethods.GetCampRSLEvents, campId);
  }

  public async getCamps(idx: number, count: number): Promise<Camp[]> {
    return await call(this.worker, DataMethods.GetCamps, idx, count);
  }

  public livePath(dataset: string, name: Names, ext?: string): string {
    if (name == 'festivals') {
      return `${data_dust_events}${dataset}.${ext ? ext : 'json'}`;
    }
    if (name == 'location') {
      return `https://api.dust.events/location`;
    }
    if (this.isStatic(dataset)) {
      return `${static_dust_events}${dataset}/${name}.${ext ? ext : 'json'}`;
    } else {
      return `${data_dust_events}${dataset}/${this.prefix}${name}.${ext ? ext : 'json'}`;
    }
  }

  private isStatic(dataset: string): boolean {
    return (dataset.toLowerCase().includes('ttitd') || dataset == 'datasets');
  }

  public async getLiveBinary(dataset: string, filename: string, revision: string): Promise<string> {
    const domain = this.isStatic(dataset) ? static_dust_events : data_dust_events;
    return `${domain}${dataset}/${filename}?${revision}`;
  }

}

