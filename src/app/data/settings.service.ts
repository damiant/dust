import { Injectable } from '@angular/core';
import { LocationEnabledStatus, Settings } from './models';
import { Preferences } from '@capacitor/preferences';
import { set, get } from 'idb-keyval';
import { ThemePrimaryColor } from '../ui/ui.service';

export const SettingNames = {
  MapURI: 'mapUri',
};

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  public settings!: Settings;

  public async init() {
    this.settings = await this.getSettings();
    this.validate();
    this.applyTheme();
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
    } catch {
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
      return value == 1;
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

  public async getSettings(): Promise<Settings> {
    try {
      const settings = JSON.parse(await this.getPref('settings'));
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
        lastDatasetId: '',
      };
    }
  }

  public eventTitle(): string {
    return this.settings.eventTitle;
  }

  public async clearSelectedEvent() {
    this.settings.datasetId = '';
    this.settings.dataset = undefined;
    this.settings.eventTitle = '';
    this.applyTheme();
    await this.save();
  }

  public async save() {
    await this.setPref('settings', JSON.stringify(this.settings));
  }

  private async getPref(key: string): Promise<string> {
    const r = await Preferences.get({ key: key });
    if (r.value == null) {
      throw new Error(`Key ${key} not found`);
    }
    return r.value;
  }

  private async setPref(key: string, value: string): Promise<void> {
    await Preferences.set({ key, value });
  }

  public async setLastGeoAlert() {
    this.settings.lastGeoAlert = Date.now();
    await this.save();
  }

  public async setLastAboutAlert() {
    this.settings.lastAboutAlert = Date.now();
    await this.save();
  }

  public shouldAboutAlert(): boolean {
    const lastAboutAlert = this.settings.lastAboutAlert ?? 0;
    if (lastAboutAlert == 0) return true;
    return Date.now() - lastAboutAlert > 86400000;
  }

  public setLastLongEventsAlert() {
    this.settings.lastLongEvents = Date.now();
    this.save();
  }

  public shouldLastLongEventsAlert(): boolean {
    const lastLongEvents = this.settings.lastLongEvents ?? 0;
    if (lastLongEvents == 0) return true;
    return Date.now() - lastLongEvents > 86400000;
  }

  public shouldGeoAlert(): boolean {
    const lastGeoAlert = this.settings.lastGeoAlert ?? 0;
    if (lastGeoAlert == 0) return true;
    return Date.now() - lastGeoAlert > 86400000;
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

  /**
   * Apply the theme from the selected dataset
   * Sets the --ion-color-primary CSS variable based on theme.primaryColor
   * Falls back to ThemePrimaryColor if theme is undefined
   * Sets it on both :root and body with !important to override dark mode media query
   */
  public applyTheme(): void {
    const primaryColor = this.settings.dataset?.theme?.primaryColor;
    const validatedColor = this.isValidColor(primaryColor) ? primaryColor! : ThemePrimaryColor;
    
    // Set on :root
    document.documentElement.style.setProperty('--ion-color-primary', validatedColor);
    
    // Create or update a style element to override dark mode with !important
    let styleEl = document.getElementById('theme-override-styles') as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'theme-override-styles';
      document.head.appendChild(styleEl);
    }
    
    // Use !important to override the media query
    styleEl.textContent = `
      body {
        --ion-color-primary: ${validatedColor} !important;
      }
    `;
  }

  /**
   * Validates if a string is a valid CSS color value
   * Supports hex colors, rgb/rgba, and named colors
   */
  private isValidColor(color: string | undefined): boolean {
    if (!color) return false;
    // Simple validation for hex colors (#RGB, #RRGGBB, #RRGGBBAA)
    const hexPattern = /^#([0-9A-Fa-f]{3}){1,2}([0-9A-Fa-f]{2})?$/;
    if (hexPattern.test(color)) return true;
    // For other formats, use browser's CSS validation
    const style = new Option().style;
    style.color = color;
    return style.color !== '';
  }
}
