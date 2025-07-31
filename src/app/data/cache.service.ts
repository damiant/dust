import { Injectable, Signal, WritableSignal, inject } from "@angular/core";
import { DbService } from "./db.service";
import { getCachedImage } from "./cache-store";
import { Art, Camp } from "./models";

@Injectable({
    providedIn: 'root',
})
export class CacheService {
    private db = inject(DbService);

    public async download(status: WritableSignal<string>): Promise<string> {
        // Get all art from the database
        const arts = await this.db.findArts(undefined, undefined);
        const imagesUrls = this.getArtImages(arts);

        // Get all camps and append their images
        const camps = await this.db.findCamps('', undefined);
        this.getCampImages(camps, imagesUrls);

        const currentTime = Date.now();
        await this.cacheImages(imagesUrls, status);
        if (currentTime - Date.now() >= 1000) {
            return `Images are now available offline.`;
        }
        return '';
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

    private async cacheImages(imageUrls: string[], status: WritableSignal<string>): Promise<void> {
        let id = 1;
        let lastUpdateTime = 0;
        
        for (const imageUrl of imageUrls) {
            try {
                const currentTime = Date.now();
                if (currentTime - lastUpdateTime >= 500) {
                    status.set(`${id} of ${imageUrls.length} images downloaded`);
                    lastUpdateTime = currentTime;
                }
                
                // Attempt to cache each image
                await getCachedImage(imageUrl);
                id++;
            } catch (error) {
                console.error(`Failed to cache image: ${imageUrl}`, error);
                id++;
            }
        }
    }
}