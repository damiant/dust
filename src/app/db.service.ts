import { Injectable, signal } from '@angular/core';
import { Event, Day, Camp, Art, Pin } from './models';
import { call, registerWorker } from './worker-interface';
import { noDate, now } from './utils';

@Injectable({
  providedIn: 'root'
})
export class DbService {
  public selectedDay = signal(noDate());
  public selectedYear = signal('');
  private initialized = false;
  private hideLocations = true;
  private worker!: Worker;

  public async init(dataset: string) {
    if (this.initialized) return;
    this.worker = new Worker(new URL('./app.worker', import.meta.url));
    registerWorker(this.worker);

    await call(this.worker, 'populate', dataset, this.hideLocations);
    this.initialized = true;
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
    return await call(this.worker, 'checkEvents', day);
  }

  public async findEvents(query: string, day: Date | undefined, category: string): Promise<Event[]> {
    return await call(this.worker, 'findEvents', query, day, category);
  }

  public async getEventList(ids: string[]): Promise<Event[]> {
    return await call(this.worker, 'getEventList', ids);
  }

  public async getPotties(): Promise<Pin[]> {
    return await call(this.worker, 'getPotties');
  }

  public async getCategories(): Promise<string[]> {
    return await call(this.worker, 'getCategories');
  }

  public async getCampList(ids: string[]): Promise<Camp[]> {
    return await call(this.worker, 'getCampList', ids);
  }
  
  public async getArtList(ids: string[]): Promise<Art[]> {
    return await call(this.worker, 'getArtList', ids);
  }

  public async findCamps(query: string): Promise<Camp[]> {
    return await call(this.worker, 'findCamps', query);
  }

  public async findArts(query: string | undefined): Promise<Art[]> {
    return await call(this.worker, 'findArts', query);
  }

  public async findArt(uid: string): Promise<Art> {
    return await call(this.worker, 'findArt', uid);
  }

  public async findEvent(uid: string): Promise<Event> {
    return await call(this.worker, 'findEvent', uid);
  }

  public async findCamp(uid: string): Promise<Camp> {
    return await call(this.worker, 'findCamp', uid);
  }

  public async getDays(): Promise<Day[]> {
    return await call(this.worker, 'getDays');
  }

  public async getEvents(idx: number, count: number): Promise<Event[]> {
    return await call(this.worker, 'getEvents', idx, count);
  }

  public async setDataset(dataset: string, events: Event[], camps: Camp[], art: Art[]): Promise<void> {
    if (!events || events.length == 0) {
      return;
    }
    return await call(this.worker, 'setDataset', dataset, events, camps, art, this.hideLocations);
  }

  public async getCampEvents(campId: string): Promise<Event[]> {
    return await call(this.worker, 'getCampEvents', campId);
  }

  public async getCamps(idx: number, count: number): Promise<Camp[]> {
    return await call(this.worker, 'getCamps', idx, count);
  }
}

