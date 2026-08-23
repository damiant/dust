import { Injectable } from '@angular/core';
import { Capacitor, registerPlugin } from '@capacitor/core';

/**
 * A camp to send to the Apple Watch companion app. The watch uses its own GPS
 * to compute a live compass-needle direction and distance to this target.
 */
export interface WatchTarget {
  name: string;
  lat: number;
  lng: number;
}

export interface SendCampResult {
  ok: boolean;
  /** True when the request reached the native iOS bridge. */
  reachable: boolean;
  error?: string;
}

/**
 * Native contract implemented by the iOS WatchConnectivity plugin
 * (see ios/App/App/WatchConnectivityPlugin.swift).
 */
export interface WatchConnectivityPlugin {
  isWatchAppInstalled(): Promise<{ installed: boolean }>;
  sendCamp(options: WatchTarget): Promise<{ success: boolean; error?: string }>;
}

const WatchConnectivity = registerPlugin<WatchConnectivityPlugin>('WatchConnectivity');

@Injectable({
  providedIn: 'root',
})
export class WatchService {
  /**
   * True only when running on iOS with an installed Dust Apple Watch companion
   * app. Used to conditionally reveal the "Show on Watch" menu item.
   */
  public async isWatchAvailable(): Promise<boolean> {
    const native = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform();
    console.log(`[watch] isWatchAvailable() native=%o platform=%o`, native, platform);
    if (!native || platform !== 'ios') {
      console.log(`[watch] not native iOS -> unavailable`);
      return false;
    }
    try {
      const result = await WatchConnectivity.isWatchAppInstalled();
      console.log(`[watch] isWatchAppInstalled() result=%o`, result);
      return result.installed === true;
    } catch (e) {
      console.warn(`[watch] isWatchAppInstalled() threw:`, e);
      return false;
    }
  }

  /**
   * Send a camp to the paired Apple Watch. Returns a structured result so the
   * caller can show a confirmation or a clear error.
   */
  public async sendCamp(target: WatchTarget): Promise<SendCampResult> {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
      return { ok: false, reachable: false, error: 'Apple Watch is only supported on iPhone.' };
    }
    try {
      const result = await WatchConnectivity.sendCamp(target);
      return { ok: result.success === true, reachable: true, error: result.error };
    } catch (e) {
      const message = e instanceof Error ? e.message : undefined;
      return { ok: false, reachable: false, error: message ?? 'Could not reach the Apple Watch right now.' };
    }
  }
}
