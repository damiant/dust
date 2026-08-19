import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { clear } from 'idb-keyval';

const STARTING_KEY = 'starting';

/**
 * Guards against a corrupted startup by flagging app startup as "in progress"
 * before the splash screen is shown and clearing it once the splash screen is
 * dismissed.
 *
 * If the app starts while the flag is still set, a previous launch never made it
 * past the splash screen (eg the app was killed mid-startup and left the local
 * data in a bad state). In that case we wipe every storage area the app uses so
 * the next launch starts cleanly - mirroring what a delete + reinstall does.
 */
@Injectable({
  providedIn: 'root',
})
export class StartupService {
  /** True if a previous run started but never reached the splash-dismissed state. */
  public isStuck(): boolean {
    try {
      return localStorage.getItem(STARTING_KEY) === 'true';
    } catch (e) {
      console.error('Failed to read startup flag', e);
      return false;
    }
  }

  /** Mark startup as in progress. Call at the very start of boot, before any data is read. */
  public markStarted(): void {
    try {
      localStorage.setItem(STARTING_KEY, 'true');
    } catch (e) {
      console.error('Failed to mark startup started', e);
    }
  }

  /** Mark startup as complete. Call as soon as the splash screen is dismissed. */
  public markFinished(): void {
    try {
      localStorage.setItem(STARTING_KEY, 'false');
    } catch (e) {
      console.error('Failed to mark startup finished', e);
    }
  }

  /**
   * Wipe every storage area the app uses so the next launch behaves like a
   * fresh install:
   * - IndexedDB (idb-keyval: dataset maps, events, camps, art, summaries, pins)
   * - Capacitor Preferences (settings, favorites, things, pins, cached revision, map URI)
   * - Filesystem Cache directory (cached images and audio)
   * - localStorage (auth token, startup flag)
   */
  public async clearAll(): Promise<void> {
    try {
      await clear();
    } catch (e) {
      console.error('Failed to clear IndexedDB', e);
    }
    try {
      await Preferences.clear();
    } catch (e) {
      console.error('Failed to clear Preferences', e);
    }
    try {
      // The cache directory may not exist yet (eg first launch on web). Check
      // before reading so we don't throw a noisy "Folder does not exist" error.
      const stat = await Filesystem.stat({ path: '.', directory: Directory.Cache });
      if (stat.type === 'directory') {
        const dir = await Filesystem.readdir({ path: '.', directory: Directory.Cache });
        for (const file of dir.files) {
          await Filesystem.deleteFile({ path: file.name, directory: Directory.Cache });
        }
      }
    } catch (e) {
      console.debug('Cache directory not present; nothing to clear', e);
    }
    try {
      localStorage.clear();
    } catch (e) {
      console.error('Failed to clear localStorage', e);
    }
  }
}
