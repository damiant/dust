import { Injectable } from '@angular/core';
import { LocationEnabledStatus, Settings } from './models';

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
        offlineEvents: [],
        scrollLeft: 0

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

  public setOffline(datasetId: string) {
    if (!this.settings.offlineEvents.includes(datasetId)) {
      this.settings.offlineEvents.push(datasetId);
    }
  }

  public isOffline(datasetId: string) {
    return this.settings.offlineEvents.includes(datasetId);
  }
}
