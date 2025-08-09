import { Injectable, WritableSignal, inject } from "@angular/core";
import { DbService } from "./db.service";
import { getCachedAudio, getCachedImage } from "./cache-store";
import { Art, Camp } from "./models";
type CacheType = 'Image' | 'Audio';

@Injectable({
    providedIn: 'root',
})
export class CacheService {
    private db = inject(DbService);


    public async download(status: WritableSignal<string>): Promise<string> {
        // Get all art from the database
        const arts = await this.db.findArts(undefined, undefined);
        const imagesUrls = this.getArtImages(arts);

        // Get all audio
        const audioUrls = await this.getAudio(arts);
        await this.cacheFiles(audioUrls, status, 'Audio');

        // Get all camps and append their images
        const camps = await this.db.findCamps('', undefined);
        this.getCampImages(camps, imagesUrls);

        const currentTime = Date.now();
        await this.cacheFiles(imagesUrls, status, 'Image');
        if (currentTime - Date.now() >= 1000) {
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
                art.images.forEach((imageUrl,) => {
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


    private async cacheFiles(urls: string[], status: WritableSignal<string>, type: CacheType): Promise<void> {
        let id = 1;
        let lastUpdateTime = 0;

        for (const url of urls) {
            try {
                const currentTime = Date.now();
                if (currentTime - lastUpdateTime >= 500) {
                    status.set(`${id} of ${urls.length} ${type}s downloaded`);
                    lastUpdateTime = currentTime;
                }

                // Attempt to cache each image
                if (type === 'Audio') {
                    await getCachedAudio(url);
                } else if (type === 'Image') {
                    await getCachedImage(url);
                }
                id++;
            } catch (error) {
                console.error(`Failed to cache ${type}: ${url}`, error);
                id++;
            }
        }
    }
}