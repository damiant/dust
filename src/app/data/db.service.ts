import { Injectable, signal } from '@angular/core';
import { Event, Day, Camp, Art, Pin, DataMethods, MapSet, GeoRef, Dataset, RSLEvent } from './models';
import { call, registerWorker } from './worker-interface';
import { daysUntil, noDate, now } from '../utils/utils';
import { GpsCoord, Point } from '../map/geo.utils';

@Injectable({
  providedIn: 'root'
})
export class DbService {
  public selectedDay = signal(noDate());
  public selectedYear = signal('');
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

    return await call(this.worker, DataMethods.Populate, dataset, this.hideLocations);

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

  public async loadDatasets(): Promise<Dataset[]> {
    const res = await fetch('assets/datasets/datasets.json');
    return await res.json();
  }

  public async daysUntilStarts() {
    const datasets = await this.loadDatasets();
    console.log('daysUntilStarts', this.selectedYear());
    const year = (this.selectedYear() == '') ? datasets[0].year : this.selectedYear();
    const dataset = datasets.find((d) => d.year == year);

    const start = new Date(dataset!.start);
    const until = daysUntil(start, now());
    return until;
  }

  public async findEvents(query: string, day: Date | undefined, category: string, coords: GpsCoord | undefined): Promise<Event[]> {
    return await call(this.worker, DataMethods.FindEvents, query, day, category, coords);
  }

  public async getEventList(ids: string[]): Promise<Event[]> {
    return await call(this.worker, DataMethods.GetEventList, ids);
  }

  public async getGeoReferences(): Promise<GeoRef[]> {
    return await call(this.worker, DataMethods.GetGeoReferences);
  }

  public async gpsToPoint(gpsCoord: GpsCoord): Promise<Point> {
    return await call(this.worker, DataMethods.GpsToPoint, gpsCoord);
  }

  public async getPotties(): Promise<Pin[]> {
    return await call(this.worker, DataMethods.GetPotties);
  }

  public async getMapPoints(name: string): Promise<MapSet> {
    return await call(this.worker, DataMethods.GetMapPoints, name);
  }

  public async getRSL(terms: string, day: Date | undefined, gpsCoord: GpsCoord | undefined): Promise<RSLEvent[]> {
    return await call(this.worker, DataMethods.GetRSLEvents, terms, day, gpsCoord);
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

  public async findCamp(uid: string): Promise<Camp> {
    return await call(this.worker, DataMethods.FindCamp, uid);
  }

  public async getDays(): Promise<Day[]> {
    return await call(this.worker, DataMethods.GetDays);
  }

  public async getEvents(idx: number, count: number): Promise<Event[]> {
    return await call(this.worker, DataMethods.GetEvents, idx, count);
  }

  public async setDataset(dataset: string, events: Event[], camps: Camp[], art: Art[]): Promise<void> {
    if (!events || events.length == 0) {
      return;
    }
    return await call(this.worker, DataMethods.SetDataset, dataset, events, camps, art, this.hideLocations);
  }

  public async getCampEvents(campId: string): Promise<Event[]> {
    return await call(this.worker, DataMethods.GetCampEvents, campId);
  }

  public async getCamps(idx: number, count: number): Promise<Camp[]> {
    return await call(this.worker, DataMethods.GetCamps, idx, count);
  }
}

