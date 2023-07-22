import { Injectable } from '@angular/core';
import { Event, Day, Camp } from './models';
import { call, registerWorker } from './worker-interface';

@Injectable({
  providedIn: 'root'
})
export class DbService {

  worker!: Worker;


  constructor() {
  }

  async init() {
    // Create a new
    this.worker = new Worker(new URL('./app.worker', import.meta.url));
    registerWorker(this.worker);
    
    await call(this.worker, 'populate');    
  }

  public async findEvents(query: string, day: Date | undefined): Promise<Event[]> {
    return await call(this.worker, 'findEvents', query, day);    
  }

  public async findCamps(query: string): Promise<Camp[]> {
    return await call(this.worker, 'findCamps', query);    
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

  public async getCamps(idx: number, count: number): Promise<Camp[]> {
    return await call(this.worker, 'getCamps', idx, count);
  }
}
