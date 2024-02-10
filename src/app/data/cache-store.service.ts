import { Injectable } from '@angular/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { blobToBase64 } from './capacitor-file-reader-hack';

@Injectable({
  providedIn: 'root'
})
export class CacheStoreService {
  public async setImage(imageUrl: string): Promise<string> {
    const imageName = imageUrl.split('/').pop();
    const fileType = imageName?.split('.').pop();
    try {
      return await this.read(imageName!, fileType!);
    } catch (e) {
      return await this.storeAndReturn(imageUrl, imageName!, fileType!);
    }
  }

  private async read(imageName: string, fileType: string): Promise<string> {
    const readFile = await Filesystem.readFile({
      directory: Directory.Cache,
      path: `${imageName}`
    });
    return `data:image/${fileType};base64,${readFile.data}`;
  }

  private async storeAndReturn(imageUrl: string, imageName: string, fileType: string) {
    await this.storeImage(imageUrl, imageName);
    return await this.read(imageName, fileType);
  }

  private async storeImage(url: string, path: string) {
    const response = await fetch(url);
    const blob = await response.blob();
    const base64Data = await blobToBase64(blob) as string;
    const savedFile = await Filesystem.writeFile({
      path: `${path}`,
      data: base64Data,
      directory: Directory.Cache
    });
    return savedFile;
  }
}
