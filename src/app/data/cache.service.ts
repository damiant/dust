import { Injectable, WritableSignal, inject } from '@angular/core';
import { DbService } from './db.service';
import { getCachedAudio, getCachedImage } from './cache-store';
import { Art, Camp } from './models';
import { SettingsService } from './settings.service';
import { ApiService } from './api.service';
type CacheType = 'Images' | 'Audio';

export interface CacheStatus {
  status: string;
  count: number;
  at: number;
}

@Injectable({
  providedIn: 'root',
})
export class CacheService {
  private db = inject(DbService);
  private api = inject(ApiService);
  private settings = inject(SettingsService);

  public InitialCacheStatus(): CacheStatus {
    return {
      status: '',
      count: 100,
      at: 0,
    };
  }

  public async isCached(): Promise<boolean> {
    const cached = await this.settings.getInteger(`${this.settings.settings.datasetId}-cachedRevision`);
    const revision = await this.api.getRevision(this.settings.settings.datasetId);
    const r = revision ? revision.revision : 0;
    return cached === r;
  }

  public async cachedBefore(): Promise<boolean> {
    const cached = await this.settings.getInteger(`${this.settings.settings.datasetId}-cachedRevision`);
    return !cached || cached === 0;
  }

  public async download(status: WritableSignal<CacheStatus>, abort: WritableSignal<boolean>): Promise<string> {
    // Get all art from the database
    const arts = await this.db.findArts(undefined, undefined);
    const imagesUrls = this.getArtImages(arts);
    let ok = true;

    // Get all audio
    const audioUrls = await this.getAudio(arts);
    ok = ok && (await this.cacheFiles(audioUrls, status, 'Audio', abort));

    // Get all camps and append their images
    const camps = await this.db.findCamps('', undefined);
    this.getCampImages(camps, imagesUrls);

    const currentTime = Date.now();
    ok = ok && (await this.cacheFiles(imagesUrls, status, 'Images', abort));
    if (ok) {
      console.log(`All images and audio cached successfully.`);
      const revision = await this.api.getRevision(this.settings.settings.datasetId);
      await this.settings.setInteger(
        `${this.settings.settings.datasetId}-cachedRevision`,
        revision ? revision.revision : 0,
      );
    }
    if (currentTime - Date.now() >= 1000 && ok) {
      return `Images are now available offline.`;
    }
    return '';
  }

  private async getAudio(arts: Art[]): Promise<string[]> {
    const audioUrls: string[] = [];
    // Iterate over each art piece
    for (const art of arts) {
      if (art.audio && art.audio.length > 0) {
        audioUrls.push(art.audio);
      }
    }
    return audioUrls;
  }

  private getArtImages(arts: Art[]): string[] {
    const imagesUrls: string[] = [];
    // Iterate over each art piece
    for (const art of arts) {
      if (art.images && art.images.length > 0) {
        // Log each image URL for this art piece
        art.images.forEach((imageUrl) => {
          if (imageUrl.thumbnail_url) {
            imagesUrls.push(imageUrl.thumbnail_url);
          }
        });
      }
    }
    return imagesUrls;
  }

  private getCampImages(camps: Camp[], imagesUrls: string[]): void {
    // Iterate over each camp
    for (const camp of camps) {
      if (camp.imageUrl) {
        // Log each image URL for this camp
        if (camp.imageUrl) {
          imagesUrls.push(camp.imageUrl);
        }
      }
    }
  }

  private async cacheFiles(
    urls: string[],
    status: WritableSignal<CacheStatus>,
    type: CacheType,
    abort: WritableSignal<boolean>,
  ): Promise<boolean> {
    let id = 1;
    let lastUpdateTime = 0;

    for (const url of urls) {
      try {
        if (abort()) {
          status.set({ status: 'Download aborted', count: 0, at: 0 });
          return false;
        }
        const currentTime = Date.now();
        if (currentTime - lastUpdateTime >= 500) {
          status.set({ status: `Downloading ${type}`, count: urls.length, at: id });
          lastUpdateTime = currentTime;
        }

        // Attempt to cache each image
        if (type === 'Audio') {
          await getCachedAudio(url);
        } else if (type === 'Images') {
          await getCachedImage(url);
        }
        id++;
      } catch (error) {
        console.error(`Failed to cache ${type}: ${url}`, error);
        id++;
      }
    }
    return true;
  }
}
