import { Injectable, signal } from '@angular/core';
import PouchDB from 'pouchdb';
import { Favorites } from './models';

enum DbId {
  favorites = 'favorites'
}

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {

  private db!: PouchDB.Database;

  private ready: Promise<void>;
  public changed = signal(1);

  private favorites: Favorites = { art: [], events: [], camps: [], friends: [] };

  constructor() {
    this.db = new PouchDB('favorites');
    this.ready = this.load();
  }

  public async getFavorites(): Promise<Favorites> {
    await this.ready;
    return this.favorites;
  }

  public async isFavEvent(id: string): Promise<boolean> {
    await this.ready;
    return this.favorites.events.includes(id);
  }

  public async isFavArt(id: string): Promise<boolean> {
    await this.ready;
    return this.favorites.art.includes(id);
  }

  public async isFavCamp(id: string): Promise<boolean> {
    await this.ready;
    return this.favorites.camps.includes(id);
  }

  public async starEvent(star: boolean, eventId: string) {
    this.favorites.events = this.include(star, eventId, this.favorites.events);
    await this.saveFavorites();
  }

  private async saveFavorites() {
    const doc = await this.get(DbId.favorites, this.favorites);
    doc.data = this.favorites;
    await this.db.put(doc);
    const i = this.changed();
    this.changed.set(i + 1);
  }

  public async starArt(star: boolean, artId: string) {
    this.favorites.events = this.include(star, artId, this.favorites.art);
    await this.saveFavorites();

  }

  public async starCamp(star: boolean, campId: string) {
    this.favorites.camps = this.include(star, campId, this.favorites.camps);
    await this.saveFavorites();
  }

  private async get(id: DbId, defaultValue: any): Promise<any> {
    try {
      return await this.db.get(DbId.favorites);
    } catch {
      return { _id: id, data: defaultValue };
    }
  }

  private async load() {
    const doc = await this.get(DbId.favorites, this.favorites);
    this.favorites = doc.data;
    console.log('load', this.favorites);
  }

  private include(add: boolean, value: string, items: string[]): string[] {
    if (add && !items.includes(value)) {
      items.push(value);
    }
    if (!add && items.includes(value)) {
      const i = items.indexOf(value);
      items.splice(i, 1);
    }
    return items;
  }
}
