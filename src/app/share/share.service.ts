import { Injectable, signal } from '@angular/core';

export interface ShareInfo {
  type: ShareInfoType;
  id: string;
  path?: string;
}

export enum ShareInfoType {
  none = '',
  art = 'art',
  event = 'event',
  camp = 'camp',
  preview = 'preview',
  token = 'token',
}

@Injectable({
  providedIn: 'root',
})
export class ShareService {
  private defaultShareInfo: ShareInfo = { type: ShareInfoType.none, id: '' };
  public hasShare = signal(this.defaultShareInfo);
  // This notifies anyone listening to the signal that we're starting with a shared item
  public notify(type: ShareInfoType, id: string, path?: string) {
    this.hasShare.set({ type, id, path });
  }
}
