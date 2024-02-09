import { Injectable, computed, signal } from '@angular/core';
import {
  Event,
  Day,
  Camp,
  Art,
  Pin,
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
} from './models';
import { call, registerWorker } from './worker-interface';
import { clone, data_dust_events, daysUntil, noDate, now, static_dust_events } from '../utils/utils';
import { GpsCoord, Point } from '../map/geo.utils';
import { environment } from 'src/environments/environment';
import { Network } from '@capacitor/network';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';


export interface GetOptions {
  timeout?: number; // Timeout when reading live
  onlyRead?: boolean; // Just read from cache, do not attempt to download
  defaultValue?: any; // Return default value on failure
  revision?: number; // This is used for cache busting
}

@Injectable({
  providedIn: 'root',
})
export class DbService {
  private defaultDataset: Dataset = { name: '', year: '', id: '', title: '', start: '', end: '', lat: 0, long: 0, imageUrl: '', timeZone: '' };
  public selectedDay = signal(noDate());
  public selectedYear = signal('');
  public selectedDataset = signal(this.defaultDataset);
  public selectedImage = computed(() => `${this.selectedDataset().imageUrl}`);
  public featuresHidden = signal(['']);
  public networkStatus = signal('');
  public resume = signal('');
  private initialized = false;
  private hideLocations = true;
  private worker!: Worker;

  public async initWorker(): Promise<void> {
    if (!this.initialized) {
      console.log(`Initializing web worker...`);
      this.worker = new Worker(new URL('./app.worker', import.meta.url));
      registerWorker(this.worker);
      console.log(`Initialized web worker`);
      this.initialized = true;
    }
  }

  public async init(dataset: string): Promise<number> {
    this.initWorker(); // Just to double check
    return await call(this.worker, DataMethods.Populate, dataset, this.hideLocations, environment);
  }

  public isHistorical(): boolean {
    // This is whether the event is in the past
    const end = new Date(this.selectedDataset().end);
    const until = daysUntil(end, now());
    return (until < 0);
  }

  public eventHasntBegun(): boolean {
    // This is whether the event has not started yet
    const start = new Date(this.selectedDataset().start);
    const until = daysUntil(start, now());
    return (until < 0);
  }

  public checkInit() {
    if (!this.initialized) {
      document.location.href = '';
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

  public async getPotties(): Promise<Pin[]> {
    return await call(this.worker, DataMethods.GetPotties);
  }

  public async getMapPoints(name: string): Promise<MapSet> {
    return await call(this.worker, DataMethods.GetMapPoints, name);
  }

  private async _read(key: string): Promise<any> {
    return await call(this.worker, DataMethods.ReadData, key);
  }

  public async get(dataset: string, name: string, options: GetOptions): Promise<any> {
    // TODO: Move this to a signal that responds to network change to improve perf
    const status = await Network.getStatus();
    try {
      if (!status.connected || options.onlyRead) {
        return await this._read(this._getkey(dataset, name));
      } else {
        let url = this.livePath(dataset, name);
        if (options.revision) {
          url += `?revision=${options.revision}`;

        }
        return await this._write(this._getkey(dataset, name), url, options.timeout ?? 30000);
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

  public async writeData(dataset: string, name: string, data: any): Promise<void> {
    this._writeData(this._getkey(dataset, name), data);
  }

  private _getkey(dataset: string, name: string): string {
    return `${dataset}-${name}`
  }

  private async _write(key: string, url: string, timeout = 30000): Promise<any> {
    return await call(this.worker, DataMethods.Write, key, url, timeout);
  }

  private async _writeData(key: string, data: any): Promise<any> {
    return await call(this.worker, DataMethods.WriteData, key, data);
  }

  public async clearIDB(): Promise<any> {
    return await call(this.worker, DataMethods.Clear);
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

  public async searchRSL(terms: string): Promise<Day[]> {
    return await call(this.worker, DataMethods.SearchRSLEvents, terms);
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

  public async getDays(): Promise<Day[]> {
    return await call(this.worker, DataMethods.GetDays);
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

  public livePath(dataset: string, name: string, ext?: string): string {
    if (name == 'festivals') {
      return `${data_dust_events}${dataset}.${ext ? ext : 'json'}`;
    }
    if (dataset.toLowerCase().includes('ttitd') || dataset == 'datasets') {
      return `${static_dust_events}${dataset}/${name}.${ext ? ext : 'json'}`;
    } else {
      return `${data_dust_events}${dataset}/${name}.${ext ? ext : 'json'}`;
    }
  }

  public async saveBinary(dataset: string, name: string, ext: string, data: any): Promise<string> {
    const id = this._getkey(dataset, name);
    const res = await Filesystem.writeFile({
      path: `${id}.${ext}`,
      data: data,
      directory: Directory.Data,
    });
    return Capacitor.convertFileSrc(res.uri);
  }

  public async stat(path: string): Promise<boolean> {
    try {
      const s = await Filesystem.stat({
        path,
        directory: Directory.Data,
      });
      return s.size > 0;
    } catch {
      return false;
    }
  }

  public async getLiveBinary(dataset: string, name: string, ext: string, revision: string): Promise<any> {
    const status = await Network.getStatus();
    if (!status.connected) {
      return undefined;
    } else {
      // Try to get from url
      try {
        const url = this.livePath(dataset, name, ext) + `?${revision}`;
        console.log(`getLive ${url} ${dataset} ${name}...`);
        const path = this._getkey(dataset, name) + '.' + ext;
        await Filesystem.downloadFile({ directory: Directory.Data, path, url });
        //const res = await fetchWithTimeout(url, 15000, 'blob');
        return await this.readBinary(this._getkey(dataset, name), undefined, ext)
      } catch (error) {
        console.error(`Failed getLiveBinary`);
        throw new Error(error as string);
      }
    }
  }

  private async readBinary(id: string, defaultValue: any, ext: string): Promise<string | Blob> {
    try {
      console.log(`Reading ${id}`);
      const contents = await Filesystem.readFile({
        path: `${id}.${ext}`,
        directory: Directory.Data,
        //encoding: Encoding.UTF8,
      });
      return contents.data;
    } catch (err) {
      console.warn(`Unable to read ${id}. Using ${JSON.stringify(defaultValue)}: ${err}`);
      return defaultValue;
    }
  }
}

