import { Injectable } from '@angular/core';
import { LocationEnabledStatus, Settings } from './models';
import { Preferences } from '@capacitor/preferences';
import { set, get } from 'idb-keyval';

export const SettingNames = {
  MapURI: 'mapUri'
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  public settings!: Settings;
  constructor() {
    this.settings = this.getSettings();
    this.validate();
  }

  private validate() {
    if (!this.settings.offlineEvents) {
      this.settings.offlineEvents = [];
    }
  }

  public isBurningMan(): boolean {
    return this.settings.datasetId.includes('ttitd');
  }

  public async getMapURI(): Promise<string | undefined> {
    return await get(SettingNames.MapURI);
  }

  public async setMapURI(uri: string) {
    await set(SettingNames.MapURI, uri);
  }

  public async setInteger(key: string, value: number) {
    await set(key, value);
  }

  public async set(key: string, value: string) {
    await set(key, value);
  }

  public async get(key: string): Promise<string | undefined> {
    return await get(key);
  }

  public async getInteger(key: string): Promise<number> {
    try {
      const value = await get(key);
      if (!value) {
        return 0;
      }
      return value;
    }
    catch {
      return 0;
    }
  }

  public async setBoolean(key: string, value: boolean): Promise<void> {
      await this.setInteger(key, value ? 1 : 0);
  }
  
  public async getBoolean(key: string): Promise<boolean> {
    try {
      const value = await get(key);
      if (!value) {
        return false;
      }
      return (value == 1);
    } catch {
      return false;
    }
  }

  public async hasValue(key: string): Promise<boolean> {
    try {
      const value = await get(key);
      if (!value) {
        return false;
      }
      return true;      
    } catch {
      return false;
    }
  }

  public getSettings(): Settings {
    try {
      const settings = JSON.parse(localStorage['settings']);
      settings.longEvents = true;
      return settings;
    } catch {
      return {
        datasetId: '',
        mapRotation: 0,
        dataset: undefined,
        eventTitle: '',
        locationEnabled: LocationEnabledStatus.Unknown,
        longEvents: true,
        datasetFilter: 'all',
        preventAutoStart: false,
        lastGeoAlert: undefined,
        lastLongEvents: undefined,
        lastAboutAlert: undefined,
        offlineEvents: [],
        list: false,
        scrollLeft: 0,
      };
    }
  }

  public eventTitle(): string {
    return this.settings.eventTitle;
  }

  public clearSelectedEvent() {
    this.settings.datasetId = '';
    this.settings.dataset = undefined;
    this.settings.eventTitle = '';
    this.save();
  }

  public save() {
    localStorage['settings'] = JSON.stringify(this.settings);
  }

  public setLastGeoAlert() {
    this.settings.lastGeoAlert = Date.now();
    this.save();
  }

  public setLastAboutAlert() {
    this.settings.lastAboutAlert = Date.now();
    this.save();
  }

  public shouldAboutAlert(): boolean {
    const lastAboutAlert = this.settings.lastAboutAlert ?? 0;
    if (lastAboutAlert == 0) return true;
    return (Date.now() - lastAboutAlert > 86400000);
  }

  public setLastLongEventsAlert() {
    this.settings.lastLongEvents = Date.now();
    this.save();
  }

  public shouldLastLongEventsAlert(): boolean {
    const lastLongEvents = this.settings.lastLongEvents ?? 0;
    if (lastLongEvents == 0) return true;
    return (Date.now() - lastLongEvents > 86400000);
  }

  public shouldGeoAlert(): boolean {
    const lastGeoAlert = this.settings.lastGeoAlert ?? 0;
    if (lastGeoAlert == 0) return true;
    return (Date.now() - lastGeoAlert > 86400000);
  }

  public setOffline(datasetId: string) {
    if (!this.settings.offlineEvents.includes(datasetId)) {
      this.settings.offlineEvents.push(datasetId);
    }
  }

  public isOffline(datasetId: string) {
    return this.settings.offlineEvents.includes(datasetId);
  }

  public async pinPassed(datasetId: string, pin: string): Promise<boolean> {
    const value = await Preferences.get({ key: `${datasetId}-pin` });
    return value.value === pin;
  }

  public async setPin(datasetId: string, pin: string): Promise<void> {
    await Preferences.set({ key: `${datasetId}-pin`, value: pin });
  }
}
