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
import { noDate } from '../utils/utils';
import { GpsCoord, Point } from '../map/geo.utils';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DbService {
  private defaultDataset: Dataset = {name: '', year: '', id: '', title: '', start: '', end: '', lat: 0, long: 0};
  public selectedDay = signal(noDate());
  public selectedYear = signal('');
  public selectedDataset = signal(this.defaultDataset);
  public selectedImage = computed(() => `assets/datasets/${this.selectedDataset().id}.webp`);
  public featuresHidden = signal(['']);
  public networkStatus = signal('');
  public resume = signal('');
  private initialized = false;
  private hideLocations = true;
  private worker!: Worker;

  public async init(dataset: string): Promise<number> {
    if (!this.initialized) {
      this.worker = new Worker(new URL('./app.worker', import.meta.url));
      registerWorker(this.worker);
      this.initialized = true;
    }

    return await call(this.worker, DataMethods.Populate, dataset, this.hideLocations, environment);
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
    return await call(this.worker, DataMethods.GetRSLEventList, ids);
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
      gps: structuredClone(gpsCoord),
      info: title ? { title, location: '', subtitle: '' } : undefined,
    };
  }

  public async getPotties(): Promise<Pin[]> {
    return await call(this.worker, DataMethods.GetPotties);
  }

  public async getMapPoints(name: string): Promise<MapSet> {
    return await call(this.worker, DataMethods.GetMapPoints, name);
  }

  public async getPins(name: string): Promise<MapSet> {
    return await call(this.worker, DataMethods.GetPins, name);
  }

  public async getGPSPoints(name: string, title: string): Promise<MapSet> {
    return await call(this.worker, DataMethods.GetGPSPoints, name, title);
  }

  public async getRSL(terms: string, day: Date | undefined, gpsCoord: GpsCoord | undefined): Promise<RSLEvent[]> {
    const r = await call(this.worker, DataMethods.GetRSLEvents, terms, day, gpsCoord);
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
      const before = structuredClone(gpsCoord);
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
}
