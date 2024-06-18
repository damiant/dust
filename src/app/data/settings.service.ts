import { Injectable } from '@angular/core';
import { LocationEnabledStatus, Settings } from './models';
import { Preferences } from '@capacitor/preferences';

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

  public getSettings(): Settings {
    try {
      const settings = JSON.parse(localStorage['settings']);
      settings.longEvents = true;
      return settings;
    } catch {
      return {
        datasetId: '',
        mapRotation: 0,
        mapUri: '',
        dataset: undefined,
        eventTitle: '',
        locationEnabled: LocationEnabledStatus.Unknown,
        longEvents: true,
        preventAutoStart: false,
        lastGeoAlert: undefined,
        offlineEvents: [],
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
    if (!this.settings.mapUri || this.settings.mapUri.length > 5000000) {
      this.settings.mapUri = '';
    }
    localStorage['settings'] = JSON.stringify(this.settings);
  }

  public setLastGeoAlert() {
    this.settings.lastGeoAlert = Date.now();
    this.save();
  }

  public shouldGeoAlert(): boolean {
    const lastGeoAlert = this.settings.lastGeoAlert ?? 0;
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
