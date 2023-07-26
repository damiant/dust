import { Injectable, signal } from '@angular/core';
import { Event, Day, Camp, Art } from './models';
import { call, registerWorker } from './worker-interface';
import { noDate, now } from './utils';

@Injectable({
  providedIn: 'root'
})
export class DbService {
  public selectedDay = signal(noDate());
  private initialized = false;  
  private worker!: Worker;

  public async init() {
    this.worker = new Worker(new URL('./app.worker', import.meta.url));
    registerWorker(this.worker);

    await call(this.worker, 'populate');
    this.initialized = true;
  }

  public checkInit() {
    if (!this.initialized) {
      document.location.href = '';
    }
  }

  public async checkEvents(): Promise<void> {
    return await call(this.worker, 'checkEvents');
  }

  public async findEvents(query: string, day: Date | undefined): Promise<Event[]> {
    return await call(this.worker, 'findEvents', query, day);
  }

  public async getEventList(ids: string[]): Promise<Event[]> {
    return await call(this.worker, 'getEventList', ids);
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

  public async getCampEvents(campId: string): Promise<Event[]> {
    return await call(this.worker, 'getCampEvents', campId);
  }

  public async getCamps(idx: number, count: number): Promise<Camp[]> {
    return await call(this.worker, 'getCamps', idx, count);
  }
}

