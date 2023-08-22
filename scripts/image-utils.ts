import { existsSync } from "fs";
import fetch from "node-fetch";
import { basename } from "path";
import sharp from "sharp";

export async function downloadImageAndConvertToWebP(url: string, outputPath: string): Promise<void> {
    try {
        if (existsSync(outputPath)) {            
            return;
        }
        // Download image from the provided URL
        const response = await fetch(url);

        const imageBuffer = await response.buffer();

        // Convert and save to WebP format
        await sharp(imageBuffer)
            .resize({ width: 400 })
            .webp({ quality: 70 })            
            .toFile(outputPath, (err, info) => {
                if (err) {
                    throw err;
                }
                const ratio = imageBuffer.length / info.size;
                console.log(`Wrote ${basename(outputPath)} at ${info.size} bytes (${Math.trunc(ratio * 100)}%)`);
            });

    } catch (error) {
        console.error('Error processing image:', error);
    }
}