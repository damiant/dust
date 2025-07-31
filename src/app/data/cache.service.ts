import { Injectable, inject } from "@angular/core";
import { DbService } from "./db.service";
import { getCachedImage } from "./cache-store";
import { Art } from "./models";

@Injectable({
    providedIn: 'root',
})
export class CacheService {
    private db = inject(DbService);

    public async download(): Promise<void> {
        // Get all art from the database
        const arts = await this.db.findArts(undefined, undefined);
        const imagesUrls = this.getArtImages(arts);
        await this.cacheImages(imagesUrls);
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

    private async cacheImages(imageUrls: string[]): Promise<void> {
        for (const imageUrl of imageUrls) {
            try {
                // Attempt to cache each image
                await getCachedImage(imageUrl);
            } catch (error) {
                console.error(`Failed to cache image: ${imageUrl}`, error);
            }
        }
    }
}